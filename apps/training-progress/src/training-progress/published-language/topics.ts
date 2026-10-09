/**
 * Training Progress' published language: the integration events other contexts may consume.
 * Notifications runs in this process and gets them through the outbox's local transport.
 */
export const TrainingProgressTopics = {
  personalRecordSetV1: 'training-progress.integration.personal-record-set.v1',
  goalAchievedV1: 'training-progress.integration.goal-achieved.v1',
} as const;

/** A member set a personal record. */
export interface PersonalRecordSetV1 {
  memberId: string;
  discipline: 'CYCLING' | 'RUNNING' | 'WALKING' | 'ROWING';
  recordMetric: 'LONGEST_DISTANCE' | 'LONGEST_DURATION' | 'MOST_CALORIES';
  /** Meters, seconds or kilocalories, depending on the record metric. */
  value: number;
  /** The previous record's value, or null for the first record. */
  previousValue: number | null;
  loggedWorkoutId: string;
  /** ISO 8601: when the logged workout started. */
  setAt: string;
}

/** A member achieved a training goal. */
export interface GoalAchievedV1 {
  memberId: string;
  trainingGoalId: string;
  goalMetric: 'DISTANCE' | 'DURATION' | 'CALORIES' | 'WORKOUT_COUNT';
  /** Meters, seconds, kilocalories or workouts, depending on the goal metric. */
  target: number;
  discipline: 'CYCLING' | 'RUNNING' | 'WALKING' | 'ROWING' | null;
  startsOn: string;
  endsOn: string;
  achievedAt: string;
}
