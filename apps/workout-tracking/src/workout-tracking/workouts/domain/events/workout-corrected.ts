import { DomainEvent } from '@app/ddd';
import type { WorkoutFacts } from './workout-facts.interface.js';
import { Correction } from '../values/correction.js';

/** A workout's metrics were corrected. Carries the workout after the correction, and the correction. */
export class WorkoutCorrected extends DomainEvent {
  constructor(
    readonly workout: WorkoutFacts,
    readonly correction: Correction,
  ) {
    super(correction.correctedAt);
  }
}
