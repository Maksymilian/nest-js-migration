import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { inFlow } from './flow.js';
import { inInterface } from './interface.js';

/**
 * Runs every message handler (RabbitMQ) in the flow the message carries, or in a new one (a
 * schedule trigger starts its own), and in the interface it carries, or `rabbitmq`. The amqplib instrumentation has already started the consumer
 * span in the message's trace; the handler runs when the observable is subscribed, so that happens
 * inside the flow. HTTP requests get their flow from `FlowMiddleware`.
 */
@Injectable()
export class MessageFlowInterceptor implements NestInterceptor {
  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (executionContext.getType() !== 'rpc') {
      return next.handle();
    }
    return new Observable((subscriber) => inFlow(() => inInterface('rabbitmq', () => next.handle().subscribe(subscriber))));
  }
}
