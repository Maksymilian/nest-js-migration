import { Logger } from '@nestjs/common';
import type { ConsumerDeserializer, IncomingEvent } from '@nestjs/microservices';
import { CONSTANTS } from 'cloudevents';

/** The pattern of a message that isn't a structured-mode CloudEvent: no handler has it. */
export const NOT_A_CLOUD_EVENT = 'not-a-cloud-event';

/**
 * Reads RabbitMQ messages in the structured content mode of the CloudEvents AMQP binding: the
 * content type is `application/cloudevents+json`, and the body is the event in the JSON event
 * format. The event's `type` picks the handler, which validates the rest. Any other message has no
 * handler, so the RMQ server nacks it and RabbitMQ dead-letters it. The binary content mode isn't
 * read: Workout Tracking publishes in structured mode only.
 */
export class CloudEventDeserializer implements ConsumerDeserializer {
  private readonly logger = new Logger(CloudEventDeserializer.name);

  /** `body` is the message content, parsed as JSON when it is; `properties` are its AMQP properties. */
  deserialize(body: unknown, properties?: { contentType?: string }): IncomingEvent {
    const type = isStructured(properties?.contentType) && isObject(body) ? body.type : undefined;
    if (typeof type === 'string' && type.length > 0) {
      // No id on the packet: Nest would take the message for a request, and try to reply.
      return { pattern: type, data: body };
    }
    this.logger.warn(`Dead-lettering a message that isn't a structured-mode CloudEvent (content type: ${properties?.contentType ?? 'none'})`);
    return { pattern: NOT_A_CLOUD_EVENT, data: body };
  }
}

function isStructured(contentType: unknown): boolean {
  return typeof contentType === 'string' && contentType.split(';')[0].trim().toLowerCase() === CONSTANTS.MIME_CE_JSON;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
