import { WorkoutMetrics } from '../../../training-log/domain/values/workout-metrics.js';
import { RecordMetric } from './record-metric.js';

describe('RecordMetric', () => {
  it('reads its value from a workout', () => {
    const metrics = WorkoutMetrics.of({ durationSeconds: 2700, distanceMeters: 18200, calories: 530 });

    expect(RecordMetric.LongestDistance.of(metrics)).toBe(18200);
    expect(RecordMetric.LongestDuration.of(metrics)).toBe(2700);
    expect(RecordMetric.MostCalories.of(metrics)).toBe(530);
  });

  it('finds the same metric by its name', () => {
    expect(RecordMetric.from('MOST_CALORIES')).toBe(RecordMetric.MostCalories);
  });
});
