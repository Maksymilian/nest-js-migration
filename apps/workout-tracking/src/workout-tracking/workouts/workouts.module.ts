import { Module } from '@nestjs/common';
import { EquipmentModule } from '../equipment/equipment.module.js';
import { CorrectWorkoutHandler } from './application/commands/correct-workout.handler.js';
import { RecordWorkoutHandler } from './application/commands/record-workout.handler.js';
import { VoidWorkoutHandler } from './application/commands/void-workout.handler.js';
import { GetWorkoutHandler } from './application/queries/get-workout.handler.js';
import { ListMemberWorkoutsHandler } from './application/queries/list-member-workouts.handler.js';
import { WorkoutQueries } from './application/queries/workout-queries.js';
import { WorkoutRepository } from './domain/workout.repository.js';
import { DrizzleWorkoutQueries } from './infrastructure/drizzle-workout.queries.js';
import { DrizzleWorkoutRepository } from './infrastructure/drizzle-workout.repository.js';
import { MemberWorkoutsController } from './interface/http/member-workouts.controller.js';
import { RecordingsController } from './interface/http/recordings.controller.js';
import { WorkoutsController } from './interface/http/workouts.controller.js';

@Module({
  imports: [EquipmentModule],
  controllers: [WorkoutsController, RecordingsController, MemberWorkoutsController],
  providers: [
    RecordWorkoutHandler,
    CorrectWorkoutHandler,
    VoidWorkoutHandler,
    GetWorkoutHandler,
    ListMemberWorkoutsHandler,
    { provide: WorkoutRepository, useClass: DrizzleWorkoutRepository },
    { provide: WorkoutQueries, useClass: DrizzleWorkoutQueries },
  ],
})
export class WorkoutsModule {}
