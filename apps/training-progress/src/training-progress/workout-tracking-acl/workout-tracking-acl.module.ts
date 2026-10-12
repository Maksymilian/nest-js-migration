import { Module } from '@nestjs/common';
import { WorkoutTrackingEventsController } from './workout-tracking-events.controller.js';
import { WorkoutSnapshotTranslator } from './workout-snapshot.translator.js';

/** Training Progress' anticorruption layer towards Workout Tracking: the only code that knows its contracts. */
@Module({
  controllers: [WorkoutTrackingEventsController],
  providers: [WorkoutSnapshotTranslator],
})
export class WorkoutTrackingAclModule {}
