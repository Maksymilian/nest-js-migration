import { Injectable, NestMiddleware } from '@nestjs/common';
import { inFlow } from './flow.js';

/**
 * Runs every HTTP request in the caller's flow (`baggage: session.id=...`), or in a new one. An
 * Express-level middleware (`app.use()`, before the routes), so GraphQL and the webhooks get it too.
 */
@Injectable()
export class FlowMiddleware implements NestMiddleware {
  use(_request: unknown, _response: unknown, next: () => void) {
    inFlow(next);
  }
}
