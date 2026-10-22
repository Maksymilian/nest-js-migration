import { OnTracedOutboxMessage } from '@app/telemetry';
import { Injectable } from '@nestjs/common';
import { MailError, Mailer } from '@nestjs/mail';
import { NonRetryableMessageError, type OutboxHandlerContext } from '@nestjs/outbox';
import { type GoalAchievedV1, TrainingProgressTopics } from '../training-progress/published-language/topics.js';
import { MemberContactDirectory } from './member-contact-directory.js';
import { GoalAchievedMail } from './goal-achieved.mail.js';

/** Notify Goal Achieved: send a notification when a training goal is achieved. */
@Injectable()
export class NotifyGoalAchievedHandler {
  constructor(
    private readonly mailer: Mailer,
    private readonly contacts: MemberContactDirectory,
  ) {}

  // The inbox skips messages this consumer already handled.
  @OnTracedOutboxMessage(TrainingProgressTopics.goalAchievedV1, { consumer: 'notifications.goal-achieved' })
  async notify(goal: GoalAchievedV1, { message, signal }: OutboxHandlerContext) {
    const contact = await this.contacts.contactOf(goal.memberId);
    try {
      await this.mailer.send(GoalAchievedMail, {
        to: contact,
        data: { contact, goal },
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
