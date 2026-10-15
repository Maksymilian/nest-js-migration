import { context, propagation, ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { startTestSdk } from '../test/test-sdk.js';
import { currentInterface, INTERFACE, inInterface } from './interface.js';

describe('inInterface', () => {
  const sdk = startTestSdk();
  const tracer = trace.getTracer('test');
  afterEach(() => {
    sdk.spans.reset();
    sdk.records.reset();
  });
  afterAll(() => sdk.stop());

  /** A roundtrip through `name`: the entry span, started in `caller`, then a span and a log record inside. */
  function roundtrip(name: 'graphql' | 'telegram', caller = ROOT_CONTEXT) {
    let inside: string | undefined;
    context.with(caller, () =>
      tracer.startActiveSpan('entry', (entry) => {
        inInterface(name, () => {
          inside = currentInterface();
          tracer.startSpan('inside').end();
          logs.getLogger('test').emit({ body: 'inside' });
        });
        entry.end();
      }),
    );
    const spans = Object.fromEntries(sdk.spans.getFinishedSpans().map((span) => [span.name, span.attributes[INTERFACE]]));
    const [record] = sdk.records.getFinishedLogRecords();
    return { inside, spans, record: record.attributes[INTERFACE] };
  }

  it('puts the interface on every span and log record of the roundtrip, the entry span included', () => {
    const { inside, spans, record } = roundtrip('graphql');

    expect(inside).toBe('graphql');
    expect(spans).toEqual({ entry: 'graphql', inside: 'graphql' });
    expect(record).toBe('graphql');
  });

  it("keeps the caller's interface, from its baggage: a message keeps the interface of the request that caused it", () => {
    const { inside, spans } = roundtrip('telegram', propagation.extract(ROOT_CONTEXT, { baggage: 'interface=rest' }));

    expect(inside).toBe('rest');
    expect(spans).toEqual({ entry: 'rest', inside: 'rest' });
  });

  it('keeps the flow id in the baggage', () => {
    let baggage: string | undefined;
    context.with(propagation.extract(ROOT_CONTEXT, { baggage: 'session.id=flow-1' }), () =>
      inInterface('graphql', () => {
        const carrier: Record<string, string> = {};
        propagation.inject(context.active(), carrier);
        baggage = carrier.baggage;
      }),
    );

    expect(baggage?.split(',').sort()).toEqual(['interface=graphql', 'session.id=flow-1']);
  });
});
