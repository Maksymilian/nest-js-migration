import { MemberId } from '../../members/domain/values/member-id.js';
import { Discipline } from '../../training-log/domain/values/discipline.js';
import { GoalNotActive } from './errors/goal-not-active.js';
import { TrainingGoalNotFound } from './errors/training-goal-not-found.js';
import { GoalAbandoned } from './events/goal-abandoned.js';
import { GoalAchieved } from './events/goal-achieved.js';
import { GoalMissed } from './events/goal-missed.js';
import { TrainingGoalSet } from './events/training-goal-set.js';
import { TrainingGoal } from './training-goal.js';
import { GoalMetric } from './values/goal-metric.js';
import { GoalPeriod } from './values/goal-period.js';
import { GoalProgress } from './values/goal-progress.js';
import { GoalStatus } from './values/goal-status.js';
import { GoalTarget } from './values/goal-target.js';

const now = new Date('2026-10-08T10:00:00Z');
const ada = MemberId.from('ada@example.com');

/** Given: Ada's active goal to cycle 200 km in October. */
function cycle200KmInOctober(): TrainingGoal {
  const goal = TrainingGoal.set({
    memberId: ada,
    metric: GoalMetric.from('DISTANCE'),
    target: GoalTarget.of(200_000),
    discipline: Discipline.Cycling,
    period: GoalPeriod.of(new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'), now),
    now,
  });
  goal.pullDomainEvents();
  return goal;
}

describe('TrainingGoal', () => {
  it('is set active and raises TrainingGoalSet', () => {
    const goal = TrainingGoal.set({
      memberId: ada,
      metric: GoalMetric.from('WORKOUT_COUNT'),
      target: GoalTarget.of(12),
      discipline: null,
      period: GoalPeriod.of(new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'), now),
      now,
    });

    expect(goal.pullDomainEvents()).toEqual([expect.any(TrainingGoalSet)]);
    expect(goal.props.status).toBe(GoalStatus.Active);
  });

  describe('recordProgress', () => {
    it('given progress below the target, changes nothing', () => {
      const goal = cycle200KmInOctober();

      goal.recordProgress(GoalProgress.of(150_000), now);

      expect(goal.pullDomainEvents()).toEqual([]);
    });

    it('given progress that reaches the target, achieves the goal and raises GoalAchieved', () => {
      const goal = cycle200KmInOctober();

      goal.recordProgress(GoalProgress.of(200_000), now);

      expect(goal.pullDomainEvents()).toEqual([expect.any(GoalAchieved)]);
      expect(goal.props).toMatchObject({ status: GoalStatus.Achieved, achievedAt: now });
    });

    it('state guard: an achieved goal records nothing more, so a repeated delivery is harmless', () => {
      const goal = cycle200KmInOctober();
      goal.recordProgress(GoalProgress.of(200_000), now);
      goal.pullDomainEvents();

      goal.recordProgress(GoalProgress.of(250_000), now);

      expect(goal.pullDomainEvents()).toEqual([]);
    });
  });

  describe('miss', () => {
    it('misses an active goal only after the grace period', () => {
      const goal = cycle200KmInOctober();

      goal.miss(new Date('2026-11-01T12:00:00Z'));
      expect(goal.pullDomainEvents()).toEqual([]);

      goal.miss(new Date('2026-11-02T00:00:00Z'));
      expect(goal.pullDomainEvents()).toEqual([expect.any(GoalMissed)]);
      expect(goal.props.status).toBe(GoalStatus.Missed);
    });

    it('does not miss an achieved goal', () => {
      const goal = cycle200KmInOctober();
      goal.recordProgress(GoalProgress.of(200_000), now);
      goal.pullDomainEvents();

      goal.miss(new Date('2026-12-01T00:00:00Z'));

      expect(goal.pullDomainEvents()).toEqual([]);
    });
  });

  describe('abandon', () => {
    it("lets the goal's member abandon an active goal", () => {
      const goal = cycle200KmInOctober();

      goal.abandon(ada, now);

      expect(goal.pullDomainEvents()).toEqual([expect.any(GoalAbandoned)]);
    });

    it('refuses another member, as if the goal did not exist', () => {
      expect(() => cycle200KmInOctober().abandon(MemberId.from('grace@example.com'), now)).toThrow(TrainingGoalNotFound);
    });

    it('refuses a goal that is not active', () => {
      const goal = cycle200KmInOctober();
      goal.abandon(ada, now);

      expect(() => goal.abandon(ada, now)).toThrow(GoalNotActive);
    });
  });
});
