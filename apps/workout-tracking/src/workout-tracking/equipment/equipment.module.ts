import { Module } from '@nestjs/common';
import { PairEquipmentHandler } from './application/commands/pair-equipment.handler.js';
import { RegisterEquipmentHandler } from './application/commands/register-equipment.handler.js';
import { UnpairEquipmentHandler } from './application/commands/unpair-equipment.handler.js';
import { EquipmentQueries } from './application/queries/equipment-queries.js';
import { GetEquipmentHandler } from './application/queries/get-equipment.handler.js';
import { EquipmentRepository } from './domain/equipment.repository.js';
import { DrizzleEquipmentQueries } from './infrastructure/drizzle-equipment.queries.js';
import { DrizzleEquipmentRepository } from './infrastructure/drizzle-equipment.repository.js';
import { EquipmentController } from './interface/http/equipment.controller.js';

@Module({
  controllers: [EquipmentController],
  providers: [
    RegisterEquipmentHandler,
    PairEquipmentHandler,
    UnpairEquipmentHandler,
    GetEquipmentHandler,
    { provide: EquipmentRepository, useClass: DrizzleEquipmentRepository },
    { provide: EquipmentQueries, useClass: DrizzleEquipmentQueries },
  ],
  // Recording a workout loads the equipment: its factory method creates the workout.
  exports: [EquipmentRepository],
})
export class EquipmentModule {}
