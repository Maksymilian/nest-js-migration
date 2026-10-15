import { context, propagation, ROOT_CONTEXT, SpanStatusCode, trace } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { startTestSdk } from '../test/test-sdk.js';
import { TelemetryLogger } from './telemetry-logger.js';

describe('TelemetryLogger', () => {
  const sdk = startTestSdk();
  const tracer = trace.getTracer('test');
  let stdout: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    sdk.records.reset();
    sdk.spans.reset();
    // The console output itself is Nest's ConsoleLogger: keep the test output clean.
    stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(() => sdk.stop());

  /** A request of flow `flow-1` whose handler logs; answers the handler span's context. */
  function inHandler(log: (logger: TelemetryLogger) => void) {
    const caller = propagation.extract(ROOT_CONTEXT, { baggage: 'session.id=flow-1' });
    return context.with(caller, () =>
      tracer.startActiveSpan('POST /internal/v1/equipment/:equipmentId/recordings', (request) =>
        tracer.startActiveSpan('RecordingsController.record', (handler) => {
          log(new TelemetryLogger());
          handler.end();
          request.end();
          return handler.spanContext();
        }),
      ),
    );
  }

  it('makes each log of a handler a span of its own, all children of the handler span', () => {
    const handler = inHandler((logger) => {
      logger.log('Recording accepted', 'RecordingsController');
      logger.warn('Cache read failed, reading from PostgreSQL', 'ReadCache');
    });

    const logSpans = sdk.spans.getFinishedSpans().filter((span) => span.name.startsWith('log '));
    expect(logSpans.map((span) => span.name)).toEqual(['log RecordingsController', 'log ReadCache']);
    expect(logSpans.map((span) => span.parentSpanContext?.spanId)).toEqual([handler.spanId, handler.spanId]);
    expect(new Set(logSpans.map((span) => span.spanContext().spanId)).size).toBe(2);

    const records = sdk.records.getFinishedLogRecords();
    expect(records.map((record) => record.body)).toEqual(['Recording accepted', 'Cache read failed, reading from PostgreSQL']);
    expect(records.map((record) => record.spanContext?.spanId)).toEqual(logSpans.map((span) => span.spanContext().spanId));
    expect(records.every((record) => record.spanContext?.traceId === handler.traceId)).toBe(true);
    expect(records[1]).toMatchObject({ severityNumber: SeverityNumber.WARN, attributes: { 'logger.name': 'ReadCache', 'session.id': 'flow-1' } });
  });

  it('marks the span of an error log as failed, and keeps the stack on the record', () => {
    inHandler((logger) => logger.error('Could not publish', 'Error: broker unreachable\n    at relay', 'OutboxRelay'));

    const [logSpan] = sdk.spans.getFinishedSpans().filter((span) => span.name.startsWith('log '));
    expect(logSpan.status).toEqual({ code: SpanStatusCode.ERROR, message: 'Could not publish' });
    const [record] = sdk.records.getFinishedLogRecords();
    expect(record.severityNumber).toBe(SeverityNumber.ERROR);
    expect(record.attributes).toMatchObject({ 'logger.name': 'OutboxRelay', 'exception.stacktrace': 'Error: broker unreachable\n    at relay' });
  });

  it('with console: false (LOG_CONSOLE=off), sends to OpenTelemetry only', () => {
    new TelemetryLogger({ console: false }).error('Could not publish', 'Error: broker unreachable', 'OutboxRelay');

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
    expect(sdk.records.getFinishedLogRecords().map((record) => record.body)).toEqual(['Could not publish']);
  });

  it('prints to the console by default', () => {
    new TelemetryLogger().error('Could not publish', 'Error: broker unreachable', 'OutboxRelay');

    expect(stderr).toHaveBeenCalled();
  });

  it('logs outside a trace without a span', () => {
    new TelemetryLogger().log('Telegram bot off', 'TelegramBot');

    expect(sdk.spans.getFinishedSpans()).toEqual([]);
    expect(sdk.records.getFinishedLogRecords()[0].spanContext).toBeUndefined();
  });
});
