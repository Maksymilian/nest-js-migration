import { FlowMiddleware, InterfaceMiddleware } from '@app/telemetry';
import { type INestApplication, RequestMethod } from '@nestjs/common';

/**
 * GraphQL serves members at `/graphql`. Internal admin routes live under `/internal`; health
 * routes stay at `/health/...`, and Telegram's webhook at `/telegram/updates`. Every request runs
 * in its flow (the caller's `session.id` baggage, or a new one) and its interface: `graphql`,
 * `telegram` (the webhook), or `rest`. Used by `main.ts` and the e2e tests.
 */
export function configureHttp(app: INestApplication): INestApplication {
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
