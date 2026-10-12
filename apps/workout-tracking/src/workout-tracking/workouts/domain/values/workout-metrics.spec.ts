import { InvalidWorkoutMetrics } from '../errors/invalid-workout-metrics.js';
import { WorkoutMetrics } from './workout-metrics.js';

describe('WorkoutMetrics', () => {
  it('accepts a duration of up to 24 hours, and zero distance and calories', () => {
    expect(() => WorkoutMetrics.of({ durationSeconds: 86_400, distanceMeters: 0, calories: 0 })).not.toThrow();
  });

  it.each([
    { durationSeconds: 0, distanceMeters: 100, calories: 10 },
    { durationSeconds: 86_401, distanceMeters: 100, calories: 10 },
    { durationSeconds: 60, distanceMeters: -1, calories: 10 },
    { durationSeconds: 60, distanceMeters: 100, calories: 1.5 },
  ])('refuses %j', (metrics) => {
    expect(() => WorkoutMetrics.of(metrics)).toThrow(InvalidWorkoutMetrics);
  });

  it('is compared by value', () => {
    const metrics = { durationSeconds: 60, distanceMeters: 100, calories: 10 };
    expect(WorkoutMetrics.of(metrics).equals(WorkoutMetrics.of(metrics))).toBe(true);
  });
});
