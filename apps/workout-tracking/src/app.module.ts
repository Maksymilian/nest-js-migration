import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlatformModule } from './platform/platform.module.js';
import { EquipmentModule } from './workout-tracking/equipment/equipment.module.js';
import { WorkoutsModule } from './workout-tracking/workouts/workouts.module.js';

/** Composition root of the Workout Tracking service. */
@Module({
  imports: [CqrsModule.forRoot(), PlatformModule, EquipmentModule, WorkoutsModule],
})
export class AppModule {}
