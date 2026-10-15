import { FlowMiddleware, InterfaceMiddleware } from '@app/telemetry';
import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

/**
 * The internal REST API lives under `/internal/v1/...` (URI versioning after the `internal`
 * prefix). Health routes stay at `/health/...`, outside both. Every response carries the security
 * headers (Helmet 8's defaults); no CORS: equipment and services call this API, not browsers. Every
 * request runs in its flow (the caller's `session.id` baggage, or a new one) and in the `rest`
 * interface. Used by `main.ts` and the e2e tests.
 */
export function configureHttp(app: INestApplication): INestApplication {
  // First, so that every response has them, those of the middleware below included.
  app.useSecurityHeaders();
  const flow = new FlowMiddleware();
  app.use(flow.use.bind(flow));
  const rest = new InterfaceMiddleware('rest');
  app.use(rest.use.bind(rest));
  app.setGlobalPrefix('internal', { exclude: [{ path: 'health/*splat', method: RequestMethod.GET }] });
  app.enableVersioning({ type: VersioningType.URI });
  return app;
}
