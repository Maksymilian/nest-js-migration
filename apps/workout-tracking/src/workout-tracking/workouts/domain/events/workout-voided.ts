import { DomainEvent } from '@app/ddd';
import type { WorkoutFacts } from './workout-facts.interface.js';
import { VoidReason } from '../values/void-reason.js';

/** A workout was voided: kept, but it no longer counts. Carries the workout after the void. */
export class WorkoutVoided extends DomainEvent {
  constructor(
    readonly workout: WorkoutFacts,
    readonly reason: VoidReason,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
