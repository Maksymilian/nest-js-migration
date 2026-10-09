import { type INestApplication, RequestMethod } from '@nestjs/common';

/**
 * GraphQL serves members at `/graphql`. Internal admin routes live under `/internal`; health
 * routes stay at `/health/...`. Used by `main.ts` and the e2e tests.
 */
export function configureHttp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('internal', { exclude: [{ path: 'health/*splat', method: RequestMethod.GET }] });
  return app;
}
