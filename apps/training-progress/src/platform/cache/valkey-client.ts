import { trace } from '@opentelemetry/api';
import { GlideClient, OpenTelemetry } from '@valkey/valkey-glide';

/**
 * A Valkey GLIDE client for VALKEY_URL (valkey://[user:password@]host:port[/db], valkeys:// for TLS;
 * redis:// and rediss:// too, as Testcontainers writes them). It connects on its first command, so
 * a Valkey that is down doesn't stop the service from starting, and reconnects in the background.
 * Each command fails after `requestTimeout` while Valkey is unreachable, instead of queueing.
 */
export function createValkeyClient(url: string, traceSamplePercentage: number): Promise<GlideClient> {
  startValkeyTelemetry(traceSamplePercentage);
  const { protocol, hostname, port, username, password, pathname } = new URL(url);
  if (!['valkey:', 'valkeys:', 'redis:', 'rediss:'].includes(protocol)) {
    throw new Error(`VALKEY_URL must be valkey:// or valkeys://, not ${protocol}//`);
  }
  const databaseId = Number(pathname.slice(1) || 0);
  return GlideClient.createClient({
    addresses: [{ host: hostname, port: port ? Number(port) : 6379 }],
    useTLS: protocol === 'valkeys:' || protocol === 'rediss:',
    credentials: password ? { username: username ? decodeURIComponent(username) : undefined, password: decodeURIComponent(password) } : undefined,
    databaseId,
    lazyConnect: true,
    requestTimeout: 1000,
    // Reconnects after about 150 ms, 300 ms, ... up to about 5 seconds between attempts.
    connectionBackoff: { numberOfRetries: 5, factor: 150, exponentBase: 2 },
    advancedConfiguration: { connectionTimeout: 1000 },
  });
}

/**
 * GLIDE's own OpenTelemetry (its Rust core times each command): no instrumentation of the Node SDK
 * covers it. Its spans go to the same OTLP endpoint as the SDK's (Alloy), with the same Basic Auth
 * (OTEL_EXPORTER_OTLP_HEADERS, which the core reads itself), as children of the active span. It
 * samples a share of the commands (VALKEY_TRACE_SAMPLE_PERCENTAGE), not by the SDK's sampler. Once
 * per process: GLIDE ignores later calls.
 */
function startValkeyTelemetry(traceSamplePercentage: number): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, '');
  if (OpenTelemetry.isInitialized() || !endpoint || process.env.OTEL_SDK_DISABLED === 'true') {
    return;
  }
  const sends = (signal: 'TRACES' | 'METRICS') => process.env[`OTEL_${signal}_EXPORTER`] !== 'none';
  if (!sends('TRACES') && !sends('METRICS')) {
    return;
  }
  OpenTelemetry.init({
    traces: sends('TRACES') ? { endpoint: `${endpoint}/v1/traces`, samplePercentage: traceSamplePercentage } : undefined,
    metrics: sends('METRICS') ? { endpoint: `${endpoint}/v1/metrics` } : undefined,
    flushIntervalMs: 5000,
    parentSpanContextProvider: () => {
      const span = trace.getActiveSpan();
      if (!span) {
        return undefined;
      }
      const context = span.spanContext();
      return { traceId: context.traceId, spanId: context.spanId, traceFlags: context.traceFlags, traceState: context.traceState?.serialize() };
    },
  });
}
