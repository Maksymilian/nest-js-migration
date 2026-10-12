import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Environment } from './platform/config/environment.js';
import { configureHttp } from './platform/http/configure-http.js';

async function bootstrap() {
  const app = configureHttp(await NestFactory.create(AppModule));
  // On SIGTERM: readiness turns 503, the outbox relay drains, then the pool and the broker close.
  app.enableShutdownHooks();
  await app.listen(app.get(ConfigService<Environment, true>).get('PORT', { infer: true }));
}
await bootstrap();
