import type { Type } from '@nestjs/common';
import type { OutboxMessage, OutboxTransport } from '@nestjs/outbox';
import { inStagedTrace } from './staged-trace.js';

type Options = { signal: AbortSignal };
// A mixin's base needs a constructor of `any[]` (TypeScript), and a concrete publish() to call.
// oxlint-disable-next-line no-explicit-any
type Transport = new (...args: any[]) => { publish(message: OutboxMessage, options: Options): unknown };

/**
 * An outbox transport that hands each message to its broker in the trace and flow that staged it
 * (a `relay <topic>` span). The broker's instrumentation continues that trace: the amqplib
 * instrumentation adds the producer span and the message headers the consumer continues from.
 */
export function TracedTransport(Base: Type<OutboxTransport>): Type<OutboxTransport> {
  class Traced extends (Base as unknown as Transport) {
    override publish(message: OutboxMessage, options: Options): Promise<void> {
      return inStagedTrace(message, 'relay', async () => {
        await super.publish(message, options);
      });
    }
  }
  return Traced;
}
