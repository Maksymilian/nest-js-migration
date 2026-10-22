import { OnTracedOutboxMessage } from '@app/telemetry';
import { Injectable } from '@nestjs/common';
import { MailError, Mailer } from '@nestjs/mail';
import { NonRetryableMessageError, type OutboxHandlerContext } from '@nestjs/outbox';
import { type PersonalRecordSetV1, TrainingProgressTopics } from '../training-progress/published-language/topics.js';
import { MemberContactDirectory } from './member-contact-directory.js';
import { PersonalRecordMail } from './personal-record.mail.js';

/** Notify Personal Record: send a notification when a personal record is set. */
@Injectable()
export class NotifyPersonalRecordHandler {
  constructor(
    private readonly mailer: Mailer,
    private readonly contacts: MemberContactDirectory,
  ) {}

  // The inbox skips messages this consumer already handled.
  @OnTracedOutboxMessage(TrainingProgressTopics.personalRecordSetV1, { consumer: 'notifications.personal-record' })
  async notify(record: PersonalRecordSetV1, { message, signal }: OutboxHandlerContext) {
    const contact = await this.contacts.contactOf(record.memberId);
    try {
      await this.mailer.send(PersonalRecordMail, {
        to: contact,
        data: { contact, record },
        // A redelivery keeps the Message-ID (SMTP) or the Idempotency-Key (Resend)
        idempotencyKey: message.id,
        signal,
        // The outbox retries with its own backoff, and dead-letters what never succeeds
        retry: false,
      });
    } catch (error) {
      if (error instanceof MailError && error.permanent) {
        throw new NonRetryableMessageError(error.message, { cause: error });
      }
      throw error;
    }
  }
}
