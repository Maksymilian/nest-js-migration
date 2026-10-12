import { Discipline } from '../../../training-log/domain/values/discipline.js';
import { GoalMetric } from './goal-metric.js';
import { GoalPeriod } from './goal-period.js';
import { GoalProgressCriteria } from './goal-progress-criteria.js';

const october = GoalPeriod.reconstitute(new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'));
const distance = GoalMetric.from('DISTANCE');

describe('GoalProgressCriteria', () => {
  it('is met by a workout of its discipline that started inside the goal period', () => {
    const criteria = new GoalProgressCriteria(distance, october, Discipline.Cycling);

    expect(criteria.isMetBy(Discipline.Cycling, new Date('2026-10-15T08:00:00Z'))).toBe(true);
    expect(criteria.isMetBy(Discipline.Running, new Date('2026-10-15T08:00:00Z'))).toBe(false);
    expect(criteria.isMetBy(Discipline.Cycling, new Date('2026-11-01T08:00:00Z'))).toBe(false);
  });

  it('is met by any discipline when the goal has none', () => {
    const criteria = new GoalProgressCriteria(distance, october, null);

    expect(criteria.isMetBy(Discipline.Rowing, new Date('2026-10-15T08:00:00Z'))).toBe(true);
  });
});
