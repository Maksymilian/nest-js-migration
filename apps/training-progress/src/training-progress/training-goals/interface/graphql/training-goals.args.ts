import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { GoalStatusEnum } from './goal-status.enum.js';

@ArgsType()
export class TrainingGoalsArgs {
  @Field(() => GoalStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(GoalStatusEnum)
  status?: GoalStatusEnum;
}
