import { Injectable, NestMiddleware } from '@nestjs/common';
import { inInterface, type InterfaceName } from './interface.js';

/**
 * Runs the rest of an HTTP request in its interface (`interface` baggage), after `FlowMiddleware`.
 * An Express-level middleware (`app.use()`, before the routes), so GraphQL and the webhooks get it
 * too: mounted on a path for one interface, the most specific path first.
 */
@Injectable()
export class InterfaceMiddleware implements NestMiddleware {
  constructor(private readonly name: InterfaceName) {}

  use(_request: unknown, _response: unknown, next: () => void) {
    inInterface(this.name, next);
  }
}
