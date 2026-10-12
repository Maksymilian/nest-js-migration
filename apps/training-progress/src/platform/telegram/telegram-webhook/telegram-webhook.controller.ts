import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { VerifyWebhook, WebhookPayload } from '@nestjs/webhooks';
import type { Update } from 'grammy/types';
import { TelegramBot } from '../telegram-bot.js';

/**
 * Where Telegram posts the bot's updates (TELEGRAM_UPDATES=webhook), outside `/internal`. Verified
 * by the secret token, and each `update_id` handled once: a known one is answered with an empty 200.
 */
@Controller('telegram')
export class TelegramWebhookController {
  constructor(private readonly bot: TelegramBot) {}

  @Post('updates')
  @HttpCode(HttpStatus.OK)
  @VerifyWebhook('telegram')
  async receive(@WebhookPayload() update: Update): Promise<void> {
    await this.bot.handle(update);
  }
}
