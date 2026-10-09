import { registerEnumType } from '@nestjs/graphql';

export enum GoalMetricEnum {
  DISTANCE = 'DISTANCE',
  DURATION = 'DURATION',
  CALORIES = 'CALORIES',
  WORKOUT_COUNT = 'WORKOUT_COUNT',
}

registerEnumType(GoalMetricEnum, { name: 'GoalMetric' });
