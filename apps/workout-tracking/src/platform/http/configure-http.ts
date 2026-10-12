import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

/**
 * The internal REST API lives under `/internal/v1/...` (URI versioning after the `internal`
 * prefix). Health routes stay at `/health/...`, outside both. Used by `main.ts` and the e2e tests.
 */
export function configureHttp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('internal', { exclude: [{ path: 'health/*splat', method: RequestMethod.GET }] });
  app.enableVersioning({ type: VersioningType.URI });
  return app;
}
