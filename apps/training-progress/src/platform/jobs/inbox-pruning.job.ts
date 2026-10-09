import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OutboxInbox } from '@nestjs/outbox';

/** Nothing prunes the inboxes on its own. 30 days is longer than any redelivery, requeues included. */
@Injectable()
export class InboxPruningJob {
  constructor(private readonly inbox: OutboxInbox) {}

  @Cron('0 3 * * *', { name: 'inbox-pruning', timeZone: 'UTC' })
  async prune(): Promise<void> {
    await this.inbox.prune('30d');
  }
}
