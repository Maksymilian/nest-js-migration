import { InvalidWorkoutMetrics } from '../errors/invalid-workout-metrics.js';
import { WorkoutMetrics } from './workout-metrics.js';

describe('WorkoutMetrics', () => {
  it('is compared by value', () => {
    const metrics = { durationSeconds: 60, distanceMeters: 100, calories: 10 };
    expect(WorkoutMetrics.of(metrics).equals(WorkoutMetrics.of(metrics))).toBe(true);
  });

  it.each([
    { durationSeconds: 0, distanceMeters: 100, calories: 10 },
    { durationSeconds: 60, distanceMeters: -1, calories: 10 },
  ])('refuses %j', (metrics) => {
    expect(() => WorkoutMetrics.of(metrics)).toThrow(InvalidWorkoutMetrics);
  });
});
