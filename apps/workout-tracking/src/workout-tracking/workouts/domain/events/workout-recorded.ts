import { DomainEvent } from '@app/ddd';
import type { WorkoutFacts } from './workout-facts.interface.js';

/** Equipment recorded a workout. Carries the workout as recorded. */
export class WorkoutRecorded extends DomainEvent {
  constructor(
    readonly workout: WorkoutFacts,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
