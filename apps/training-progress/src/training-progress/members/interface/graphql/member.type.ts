import { Field, ID, ObjectType } from '@nestjs/graphql';

/** A member, as the root of their progress. Until Identity exists, chosen with `member(id:)`; later `me`. */
@ObjectType('Member')
export class MemberType {
  @Field(() => ID, { description: "The member's id: until Identity exists, their email address." })
  id: string;
}
