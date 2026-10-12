import { registerEnumType } from '@nestjs/graphql';

export enum GoalStatusEnum {
  ACTIVE = 'ACTIVE',
  ACHIEVED = 'ACHIEVED',
  MISSED = 'MISSED',
  ABANDONED = 'ABANDONED',
}

registerEnumType(GoalStatusEnum, { name: 'GoalStatus' });
