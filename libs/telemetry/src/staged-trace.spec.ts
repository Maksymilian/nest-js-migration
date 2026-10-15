import { propagation, ROOT_CONTEXT, SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { startTestSdk } from '../test/test-sdk.js';
import { currentFlowId, FLOW_ID } from './flow.js';
import { inStagedTrace, traceHeaders } from './staged-trace.js';

describe('staged trace', () => {
  const sdk = startTestSdk();
  const tracer = trace.getTracer('test');
  afterEach(() => sdk.spans.reset());
  afterAll(() => sdk.stop());

  /** The headers the outbox keeps for a message staged inside a request of flow `flow-1`. */
  function stage() {
    const caller = propagation.extract(ROOT_CONTEXT, { baggage: 'session.id=flow-1' });
    return context.with(caller, () =>
      tracer.startActiveSpan('request', (span) => {
        const headers = traceHeaders();
        span.end();
        return { headers, request: span.spanContext() };
      }),
    );
  }

  it('delivers a message in the trace and flow that staged it', async () => {
    const { headers, request } = stage();
    expect(headers).toMatchObject({ traceparent: expect.stringContaining(request.traceId), baggage: 'session.id=flow-1' });

    const flowId = await inStagedTrace({ id: 'message-1', topic: 'topic.v1', headers }, 'process', async () => currentFlowId());

    const delivery = sdk.spans.getFinishedSpans().find((span) => span.name === 'process topic.v1');
    expect(flowId).toBe('flow-1');
    expect(delivery?.kind).toBe(SpanKind.CONSUMER);
    expect(delivery?.spanContext().traceId).toBe(request.traceId);
    expect(delivery?.parentSpanContext?.spanId).toBe(request.spanId);
    expect(delivery?.attributes).toMatchObject({
      [FLOW_ID]: 'flow-1',
      'messaging.system': 'outbox',
      'messaging.destination.name': 'topic.v1',
      'messaging.message.id': 'message-1',
    });
  });

  it('records a failed delivery on its span, and rethrows it for the outbox to retry', async () => {
    const delivery = inStagedTrace({ id: 'message-2', topic: 'topic.v1', headers: stage().headers }, 'relay', async () => {
      throw new Error('broker unreachable');
    });

    await expect(delivery).rejects.toThrow('broker unreachable');
    const span = sdk.spans.getFinishedSpans().find((candidate) => candidate.name === 'relay topic.v1');
    expect(span?.kind).toBe(SpanKind.INTERNAL);
    expect(span?.status).toEqual({ code: SpanStatusCode.ERROR, message: 'broker unreachable' });
  });

  it('starts a trace of its own for a message staged without one', async () => {
    await inStagedTrace({ id: 'message-3', topic: 'topic.v1', headers: {} }, 'process', async () => undefined);

    expect(sdk.spans.getFinishedSpans()[0].parentSpanContext).toBeUndefined();
  });
});
