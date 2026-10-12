import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/database.js';
import { telegramChats } from '../database/schema.js';

/**
 * Which member each Telegram chat is signed in as. Stands in for Identity until an identity
 * provider exists: the member id is the email address the member typed, not verified.
 */
@Injectable()
export class TelegramChats {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  /** The member id the chat is signed in as, or `null`. */
  async memberOf(chatId: number): Promise<string | null> {
    const [row] = await this.db.select({ memberId: telegramChats.memberId }).from(telegramChats).where(eq(telegramChats.chatId, chatId));
    return row?.memberId ?? null;
  }

  /** Signs the chat in as the member, instead of the member it was signed in as. */
  async signIn(chatId: number, memberId: string, now: Date): Promise<void> {
    await this.db
      .insert(telegramChats)
      .values({ chatId, memberId, signedInAt: now })
      .onConflictDoUpdate({ target: telegramChats.chatId, set: { memberId, signedInAt: now } });
  }

  async signOut(chatId: number): Promise<void> {
    await this.db.delete(telegramChats).where(eq(telegramChats.chatId, chatId));
  }
}
