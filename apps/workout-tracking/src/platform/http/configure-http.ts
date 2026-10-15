import { FlowMiddleware, InterfaceMiddleware } from '@app/telemetry';
import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

/**
 * The internal REST API lives under `/internal/v1/...` (URI versioning after the `internal`
 * prefix). Health routes stay at `/health/...`, outside both. Every request runs in its flow (the
 * caller's `session.id` baggage, or a new one) and in the `rest` interface. Used by `main.ts` and
 * the e2e tests.
 */
export function configureHttp(app: INestApplication): INestApplication {
  const flow = new FlowMiddleware();
  app.use(flow.use.bind(flow));
  const rest = new InterfaceMiddleware('rest');
  app.use(rest.use.bind(rest));
  app.setGlobalPrefix('internal', { exclude: [{ path: 'health/*splat', method: RequestMethod.GET }] });
  app.enableVersioning({ type: VersioningType.URI });
  return app;
}
