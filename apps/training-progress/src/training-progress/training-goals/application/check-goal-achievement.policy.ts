import { Injectable } from '@nestjs/common';
import { OnOutboxMessage } from '@nestjs/outbox';
import { Transactions } from '../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../platform/outbox/domain-event-publisher.js';
import { DomainTopics, type LoggedWorkoutPayloadV1, type TrainingGoalSetPayloadV1 } from '../../../platform/outbox/domain-topics.js';
import { MemberId } from '../../members/domain/values/member-id.js';
import { Discipline } from '../../training-log/domain/values/discipline.js';
import type { TrainingGoal } from '../domain/training-goal.js';
import { TrainingGoalRepository } from '../domain/training-goal.repository.js';
import { TrainingGoalId } from '../domain/values/training-goal-id.js';
import { TrainingLogTotals } from './training-log-totals.js';

/**
 * Check Goal Achievement: whenever a workout is logged or revised, or a goal is set, record goal
 * progress on each affected active goal. Which goals are affected is the domain's decision; each
 * goal changes in its own transaction. Idempotent through the goal's state guard: a repeat finds
 * the goal achieved, or records the same progress, which changes nothing.
 */
@Injectable()
export class CheckGoalAchievementPolicy {
  constructor(
    private readonly goals: TrainingGoalRepository,
    private readonly totals: TrainingLogTotals,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  @OnOutboxMessage([DomainTopics.workoutLoggedV1, DomainTopics.loggedWorkoutRevisedV1], { consumer: 'goal-achievement' })
  async loggedWorkoutCounted(payload: LoggedWorkoutPayloadV1) {
    const discipline = Discipline.from(payload.discipline);
    const startedAt = new Date(payload.startedAt);
    const goals = await this.goals.activeGoalsOf(MemberId.from(payload.memberId));
    for (const goal of goals.filter((candidate) => candidate.progressCriteria().isMetBy(discipline, startedAt))) {
      await this.recordProgress(goal);
    }
  }

  /** Workouts already logged in the new goal's period count towards it. */
  @OnOutboxMessage(DomainTopics.trainingGoalSetV1, { consumer: 'goal-achievement' })
  async trainingGoalSet({ trainingGoalId }: TrainingGoalSetPayloadV1) {
    await this.recordProgress(await this.goals.get(TrainingGoalId.from(trainingGoalId)));
  }

  private async recordProgress(goal: TrainingGoal): Promise<void> {
    const progress = await this.totals.progress(goal.memberId, goal.progressCriteria());
    goal.recordProgress(progress, new Date());
    if (goal.hasChanges()) {
      await this.transactions.run(async (tx) => {
        await this.goals.save(tx, goal);
        await this.events.publish(tx, goal.pullDomainEvents());
      });
    }
  }
}
