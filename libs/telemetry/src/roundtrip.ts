import { type Attributes, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { inFlow } from './flow.js';

const tracer = trace.getTracer('@app/telemetry');

/**
 * Runs `work` as a roundtrip that no instrumentation starts (an update the bot fetched itself, for
 * example): a consumer span of its own, in the active trace if there is one, and in its flow. A
 * failure is recorded on the span and rethrown.
 */
export function inRoundtrip<T>(name: string, attributes: Attributes, work: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, { kind: SpanKind.CONSUMER, attributes }, (span) =>
    inFlow(async () => {
      try {
        return await work();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        throw error;
      } finally {
        span.end();
      }
    }),
  );
}
