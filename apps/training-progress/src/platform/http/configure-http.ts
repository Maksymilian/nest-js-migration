import { FlowMiddleware, InterfaceMiddleware } from '@app/telemetry';
import { type INestApplication, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../config/environment.js';

/**
 * GraphiQL, served on `/graphql` outside production, loads React and itself from unpkg.com and
 * starts with an inline script: only there does the Content Security Policy allow them.
 */
const GRAPHIQL_CONTENT_SECURITY_POLICY = { directives: { scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'] } };

/**
 * GraphQL serves members at `/graphql`. Internal admin routes live under `/internal`; health
 * routes stay at `/health/...`, and Telegram's webhook at `/telegram/updates`. Every response
 * carries the security headers (Helmet 8's defaults), and the web apps in CORS_ORIGINS may call
 * GraphQL from a browser. Every request runs in its flow (the caller's `session.id` baggage, or a
 * new one) and its interface: `graphql`, `telegram` (the webhook), or `rest`. Used by `main.ts`
 * and the e2e tests.
 */
export function configureHttp(app: INestApplication): INestApplication {
  const config = app.get<ConfigService<Environment, true>>(ConfigService);
  // First, so that every response has them, those of the middleware below included.
  app.useSecurityHeaders({
    contentSecurityPolicy: config.get('NODE_ENV', { infer: true }) === 'production' ? true : GRAPHIQL_CONTENT_SECURITY_POLICY,
  });
  const origins = (config.get('CORS_ORIGINS', { infer: true }) ?? '').split(',').filter(Boolean);
  if (origins.length > 0) {
    // Express' cors middleware. No cookies: a member is chosen by id until Identity exists.
    app.enableCors({
      origin: origins,
      methods: ['GET', 'POST'],
      // A browser app reads when to try again, and how much of the rate limit is left.
      exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 600,
    });
  }
  const flow = new FlowMiddleware();
  app.use(flow.use.bind(flow));
  for (const [path, middleware] of [
    ['/graphql', new InterfaceMiddleware('graphql')],
    ['/telegram', new InterfaceMiddleware('telegram')],
    ['/', new InterfaceMiddleware('rest')],
  ] as const) {
    app.use(path, middleware.use.bind(middleware));
  }
  app.setGlobalPrefix('internal', {
    exclude: [
      { path: 'health/*splat', method: RequestMethod.GET },
      { path: 'telegram/updates', method: RequestMethod.POST },
    ],
  });
  return app;
}
