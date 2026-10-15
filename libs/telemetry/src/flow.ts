import { randomUUID } from 'node:crypto';
import { context, propagation, trace } from '@opentelemetry/api';
import { getRPCMetadata } from '@opentelemetry/core';

/**
 * A flow is one interaction of a member that takes several roundtrips (a session in an app, a
 * conversation with the bot, a Postman run): every trace of it carries the same flow id. It is the
 * OpenTelemetry semantic conventions' `session.id`, and travels like the trace context: as W3C
 * Baggage (`baggage: session.id=<flow id>`) in HTTP requests and RabbitMQ messages, and in the
 * outbox messages' headers. The baggage processors copy it to every span and log record.
 */
export const FLOW_ID = 'session.id';

/** The flow id of the active context, if there is one. */
export function currentFlowId(): string | undefined {
  return propagation.getBaggage(context.active())?.getEntry(FLOW_ID)?.value;
}

/**
 * Runs `work` in the caller's flow, or in a new one when the caller sent no flow id, and records the
 * flow id on the roundtrip's entry span, which started before a new flow id existed: the HTTP
 * server span (which the HTTP instrumentation keeps in the context), or the active span (a
 * message's consumer span).
 */
export function inFlow<T>(work: () => T): T {
  const active = context.active();
  const baggage = propagation.getBaggage(active) ?? propagation.createBaggage();
  const flowId = baggage.getEntry(FLOW_ID)?.value ?? randomUUID();
  (getRPCMetadata(active)?.span ?? trace.getSpan(active))?.setAttribute(FLOW_ID, flowId);
  return context.with(propagation.setBaggage(active, baggage.setEntry(FLOW_ID, { value: flowId })), work);
}
