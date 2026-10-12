import { Injectable, type OnModuleInit } from '@nestjs/common';
import { isEmail } from 'class-validator';
import type { CommandContext, Context } from 'grammy';
import { TelegramBot } from './telegram-bot.js';
import { TelegramChats } from './telegram-chats.js';

const HOW_TO_SIGN_IN = 'Send /sign_in followed by your email address, for example\n/sign_in ada@example.com';

/**
 * `/start`, `/sign_in` and `/sign_out`. Until Identity exists, a member id is the member's email
 * address, not verified, as it is in the GraphQL API.
 */
@Injectable()
export class TelegramSignIn implements OnModuleInit {
  constructor(
    private readonly bot: TelegramBot,
    private readonly chats: TelegramChats,
  ) {}

  onModuleInit(): void {
    this.bot.signInCommand('start', null, (ctx) => this.start(ctx));
    this.bot.signInCommand('sign_in', 'Sign in with your email address', (ctx) => this.signIn(ctx));
    this.bot.signInCommand('sign_out', 'Sign out of this chat', (ctx) => this.signOut(ctx));
  }

  private async start(ctx: CommandContext<Context>) {
    const memberId = await this.chats.memberOf(ctx.chatId);
    if (memberId) {
      return ctx.reply(`You're signed in as ${memberId}.\n\n${this.bot.help()}`);
    }
    return ctx.reply(
      `Hi! I show your training progress: your training log, progress summaries, streak, personal records and training goals.\n\n${HOW_TO_SIGN_IN}`,
    );
  }

  private async signIn(ctx: CommandContext<Context>) {
    // The same normalization as the GraphQL inputs' member ids.
    const memberId = ctx.match.trim().toLowerCase();
    if (!memberId) {
      return ctx.reply(HOW_TO_SIGN_IN);
    }
    if (!isEmail(memberId)) {
      return ctx.reply(`"${memberId}" isn't an email address. ${HOW_TO_SIGN_IN}`);
    }
    await this.chats.signIn(ctx.chatId, memberId, new Date());
    return ctx.reply(`Signed in as ${memberId}.\n\n${this.bot.help()}`);
  }

  private async signOut(ctx: CommandContext<Context>) {
    await this.chats.signOut(ctx.chatId);
    return ctx.reply(`Signed out. ${HOW_TO_SIGN_IN}`);
  }
}
