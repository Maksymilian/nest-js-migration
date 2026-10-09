import { Module } from '@nestjs/common';
import { MemberResolver } from './interface/graphql/member.resolver.js';

@Module({
  providers: [MemberResolver],
})
export class MembersModule {}
