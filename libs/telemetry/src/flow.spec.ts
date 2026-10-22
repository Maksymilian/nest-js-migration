import { context, propagation, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { startTestSdk } from '../test/test-sdk.js';
import { currentFlowId, FLOW_ID, inFlow } from './flow.js';

describe('inFlow', () => {
  const sdk = startTestSdk();
  const tracer = trace.getTracer('test');
  afterEach(() => sdk.spans.reset());
  afterAll(() => sdk.stop());

  /** A roundtrip: the entry span, started in `caller`, and a span inside the flow. */
  function roundtrip(caller = ROOT_CONTEXT) {
    let flowId: string | undefined;
    context.with(caller, () =>
      tracer.startActiveSpan('entry', (entry) => {
        inFlow(() => {
          flowId = currentFlowId();
          tracer.startSpan('inside').end();
        });
        entry.end();
      }),
    );
    const flowIds = Object.fromEntries(sdk.spans.getFinishedSpans().map((span) => [span.name, span.attributes[FLOW_ID]]));
    return { flowId, flowIds };
  }

  it("keeps the caller's flow, from its baggage, on every span", () => {
    const { flowId, flowIds } = roundtrip(propagation.extract(ROOT_CONTEXT, { baggage: 'session.id=flow-1' }));

    expect(flowId).toBe('flow-1');
    expect(flowIds).toEqual({ entry: 'flow-1', inside: 'flow-1' });
  });

  it('starts a new flow when the caller sent none, the entry span included', () => {
    const { flowId, flowIds } = roundtrip();

    expect(flowId).toMatch(/^[0-9a-f-]{36}$/);
    expect(flowIds).toEqual({ entry: flowId, inside: flowId });
  });
});
