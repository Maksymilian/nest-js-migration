import { Module } from '@nestjs/common';
import { MemberResolver } from './interface/graphql/member.resolver.js';
import { MemberBotCommands } from './interface/telegram/member-bot-commands.js';

@Module({
  providers: [MemberResolver, MemberBotCommands],
})
export class MembersModule {}
