import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { startTestSdk } from '../test/test-sdk.js';
import { currentFlowId, FLOW_ID } from './flow.js';
import { inRoundtrip } from './roundtrip.js';

describe('inRoundtrip', () => {
  const sdk = startTestSdk();
  afterEach(() => sdk.spans.reset());
  afterAll(() => sdk.stop());

  it('runs the work in a span of its own, in a flow', async () => {
    const flowId = await inRoundtrip('telegram message', { 'telegram.update.type': 'message' }, async () => currentFlowId());

    const [span] = sdk.spans.getFinishedSpans();
    expect(span.name).toBe('telegram message');
    expect(span.kind).toBe(SpanKind.CONSUMER);
    expect(span.attributes).toEqual({ 'telegram.update.type': 'message', [FLOW_ID]: flowId });
  });

  it('records a failure on the span, and rethrows it', async () => {
    await expect(inRoundtrip('telegram message', {}, async () => Promise.reject(new Error('database down')))).rejects.toThrow('database down');

    expect(sdk.spans.getFinishedSpans()[0].status).toEqual({ code: SpanStatusCode.ERROR, message: 'database down' });
  });
});
