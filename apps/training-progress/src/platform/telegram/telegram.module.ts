import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { telegramBotProvider, TelegramBot } from './telegram-bot.js';
import { TelegramChats } from './telegram-chats.js';
import { TelegramSignIn } from './telegram-sign-in.js';
import { TelegramWebhookModule } from './telegram-webhook/telegram-webhook.module.js';

/**
 * The Telegram bot, off without TELEGRAM_BOT_TOKEN. Context modules register their bot commands
 * with `TelegramBot`. The webhook route exists only with TELEGRAM_UPDATES=webhook.
 */
@Module({
  imports: [ConditionalModule.registerWhen(TelegramWebhookModule, (env) => !!env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_UPDATES === 'webhook')],
  providers: [telegramBotProvider, TelegramBot, TelegramChats, TelegramSignIn],
  exports: [TelegramBot],
})
export class TelegramModule {}
