import { context, propagation, ROOT_CONTEXT, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import {
  ATTR_MESSAGING_DESTINATION_NAME,
  ATTR_MESSAGING_MESSAGE_ID,
  ATTR_MESSAGING_OPERATION_TYPE,
  ATTR_MESSAGING_SYSTEM,
} from '@opentelemetry/semantic-conventions/incubating';

/** What the trace needs of an outbox message. */
export interface StagedMessage {
  readonly id: string;
  readonly topic: string;
  readonly headers: Readonly<Record<string, string>>;
}

const tracer = trace.getTracer('@app/telemetry');

/**
 * The active trace context (W3C `traceparent`, `tracestate`) and baggage (the flow id), as the
 * headers of an outbox message. The outbox keeps them with the message, in the transaction of the
 * change, because it delivers the message later, outside the roundtrip that made the change.
 */
export function traceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  propagation.inject(context.active(), headers);
  return headers;
}

/**
 * Runs the delivery of an outbox message in the trace and flow that staged it, as a span of its
 * own: `relay <topic>` hands it to a broker's transport (whose instrumentation adds the producer
 * span), `process <topic>` runs an in-process handler (a consumer). A failure is recorded on the
 * span, and rethrown for the outbox to retry.
 */
export function inStagedTrace<T>(message: StagedMessage, operation: 'relay' | 'process', work: () => Promise<T>): Promise<T> {
  const parent = propagation.extract(ROOT_CONTEXT, message.headers ?? {});
  const options = {
    kind: operation === 'relay' ? SpanKind.INTERNAL : SpanKind.CONSUMER,
    attributes: {
      [ATTR_MESSAGING_SYSTEM]: 'outbox',
      [ATTR_MESSAGING_OPERATION_TYPE]: operation === 'relay' ? 'send' : 'process',
      [ATTR_MESSAGING_DESTINATION_NAME]: message.topic,
      [ATTR_MESSAGING_MESSAGE_ID]: message.id,
    },
  };
  return tracer.startActiveSpan(`${operation} ${message.topic}`, options, parent, async (span) => {
    try {
      return await work();
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  });
}
