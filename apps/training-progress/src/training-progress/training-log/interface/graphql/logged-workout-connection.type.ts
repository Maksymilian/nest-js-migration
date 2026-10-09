import { Field, ObjectType } from '@nestjs/graphql';
import { LoggedWorkoutType } from './logged-workout.type.js';

@ObjectType('PageInfo')
export class PageInfoType {
  @Field()
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType('LoggedWorkoutEdge')
export class LoggedWorkoutEdgeType {
  @Field()
  cursor: string;

  @Field(() => LoggedWorkoutType)
  node: LoggedWorkoutType;
}

@ObjectType('LoggedWorkoutConnection')
export class LoggedWorkoutConnectionType {
  @Field(() => [LoggedWorkoutEdgeType])
  edges: LoggedWorkoutEdgeType[];

  @Field(() => PageInfoType)
  pageInfo: PageInfoType;
}
