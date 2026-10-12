import type { Transaction } from '@app/ddd';
import type { LoggedWorkout } from './logged-workout.js';
import type { LoggedWorkoutId } from './values/logged-workout-id.js';

/** Port: loads and saves whole `LoggedWorkout` aggregates. */
export abstract class LoggedWorkoutRepository {
  /** The logged workout, read through the transaction, or undefined when it isn't logged yet. */
  abstract find(tx: Transaction, id: LoggedWorkoutId): Promise<LoggedWorkout | undefined>;

  /** @throws ConcurrencyConflict when the logged workout changed since it was loaded */
  abstract save(tx: Transaction, loggedWorkout: LoggedWorkout): Promise<void>;
}
