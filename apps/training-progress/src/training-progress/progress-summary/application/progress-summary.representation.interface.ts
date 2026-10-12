/** The totals of a member's counting workouts in a training period, optionally for one discipline. */
export interface ProgressSummaryRepresentation {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  discipline: string | null;
  workoutCount: number;
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  totalCalories: number;
}
