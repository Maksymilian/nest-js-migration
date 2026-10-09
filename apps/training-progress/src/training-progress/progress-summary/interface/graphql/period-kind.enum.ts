import { registerEnumType } from '@nestjs/graphql';

export enum PeriodKindEnum {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

registerEnumType(PeriodKindEnum, { name: 'PeriodKind' });
