import { OnTracedOutboxMessage } from '@app/telemetry';
import { Injectable } from '@nestjs/common';
import { type OutboxHandlerContext } from '@nestjs/outbox';
import { Transactions } from '../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../platform/outbox/domain-event-publisher.js';
import { DomainTopics, type LoggedWorkoutPayloadV1 } from '../../../platform/outbox/domain-topics.js';
import { MemberId } from '../../members/domain/values/member-id.js';
import { Discipline } from '../../training-log/domain/values/discipline.js';
import { LoggedWorkoutId } from '../../training-log/domain/values/logged-workout-id.js';
import { WorkoutMetrics } from '../../training-log/domain/values/workout-metrics.js';
import { PersonalRecords } from '../domain/personal-records.js';
import { PersonalRecordsRepository } from '../domain/personal-records.repository.js';
import { RecordCandidates } from './record-candidates.js';

const CONSUMER = 'personal-records';

/**
 * Keep Personal Records: whenever a workout is logged, consider it; whenever one is revised or
 * stops counting, recalculate from the record candidates. One `PersonalRecords` per transaction,
 * with the inbox record in it: exactly once.
 */
@Injectable()
export class KeepPersonalRecordsPolicy {
  constructor(
    private readonly personalRecords: PersonalRecordsRepository,
    private readonly recordCandidates: RecordCandidates,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  @OnTracedOutboxMessage(DomainTopics.workoutLoggedV1, { consumer: CONSUMER })
  async workoutLogged(payload: LoggedWorkoutPayloadV1, { message }: OutboxHandlerContext) {
    const memberId = MemberId.from(payload.memberId);
    const discipline = Discipline.from(payload.discipline);
    await this.transactions.runOnce(CONSUMER, message.id, async (tx) => {
      const records = (await this.personalRecords.find(tx, memberId, discipline)) ?? PersonalRecords.startFor(memberId, discipline);
      records.consider(LoggedWorkoutId.from(payload.loggedWorkoutId), new Date(payload.startedAt), WorkoutMetrics.of(payload), new Date());
      if (records.hasChanges()) {
        await this.personalRecords.save(tx, records);
        await this.events.publish(tx, records.pullDomainEvents());
      }
    });
  }

  @OnTracedOutboxMessage([DomainTopics.loggedWorkoutRevisedV1, DomainTopics.loggedWorkoutStoppedCountingV1], { consumer: CONSUMER })
  async loggedWorkoutChanged(payload: LoggedWorkoutPayloadV1, { message }: OutboxHandlerContext) {
    const memberId = MemberId.from(payload.memberId);
    const discipline = Discipline.from(payload.discipline);
    await this.transactions.runOnce(CONSUMER, message.id, async (tx) => {
      const records = await this.personalRecords.find(tx, memberId, discipline);
      if (!records) {
        return; // No record was ever set in this discipline: nothing to recalculate.
      }
      const holders = records.records.map((record) => record.loggedWorkoutId);
      records.recalculate(await this.recordCandidates.best(tx, memberId, discipline, holders), new Date());
      if (records.hasChanges()) {
        await this.personalRecords.save(tx, records);
        await this.events.publish(tx, records.pullDomainEvents());
      }
    });
  }
}
