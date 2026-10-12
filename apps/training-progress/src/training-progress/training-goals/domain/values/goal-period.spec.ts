import { InvalidGoalPeriod } from '../errors/invalid-goal-period.js';
import { GoalPeriod } from './goal-period.js';

const now = new Date('2026-10-08T10:00:00Z');

describe('GoalPeriod', () => {
  it('ends after it starts, and in the future', () => {
    expect(() => GoalPeriod.of(new Date('2026-10-31T00:00:00Z'), new Date('2026-10-01T00:00:00Z'), now)).toThrow(InvalidGoalPeriod);
    expect(() => GoalPeriod.of(new Date('2026-09-01T00:00:00Z'), new Date('2026-10-01T00:00:00Z'), now)).toThrow(InvalidGoalPeriod);
    expect(() => GoalPeriod.of(new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'), now)).not.toThrow();
  });

  it('has a one-day grace period after it ends', () => {
    const october = GoalPeriod.of(new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'), now);

    expect(october.graceEnd.toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });
});
