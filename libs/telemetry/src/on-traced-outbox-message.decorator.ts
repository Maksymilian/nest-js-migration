import { OnOutboxMessage, type OutboxHandlerContext } from '@nestjs/outbox';
import { inStagedTrace } from './staged-trace.js';

type Handler = (this: unknown, payload: unknown, context: OutboxHandlerContext) => unknown;

/**
 * `@OnOutboxMessage()`, with the handler running in the trace and flow of the change that staged
 * the message: the relay delivers it later, from its own context, so without this the handler's
 * work would belong to no trace. Use it instead of `@OnOutboxMessage()`.
 */
export function OnTracedOutboxMessage(
  topic: Parameters<typeof OnOutboxMessage>[0],
  options: Parameters<typeof OnOutboxMessage>[1],
): MethodDecorator {
  const register = OnOutboxMessage(topic, options);
  return (target, key, descriptor) => {
    const handle = descriptor.value as unknown as Handler;
    const traced: Handler = function (payload, context) {
      return inStagedTrace(context.message, 'process', async () => handle.call(this, payload, context));
    };
    descriptor.value = traced as typeof descriptor.value;
    // OnOutboxMessage keeps its metadata on the method it sees: the traced one.
    return register(target, key, descriptor);
  };
}
