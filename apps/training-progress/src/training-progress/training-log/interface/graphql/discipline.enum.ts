import { registerEnumType } from '@nestjs/graphql';

/** The GraphQL `Discipline` enum, shared by every type of this context that has one. */
export enum DisciplineEnum {
  CYCLING = 'CYCLING',
  RUNNING = 'RUNNING',
  WALKING = 'WALKING',
  ROWING = 'ROWING',
}

registerEnumType(DisciplineEnum, { name: 'Discipline' });
