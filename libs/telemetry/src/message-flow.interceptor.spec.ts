import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { defer, lastValueFrom, of } from 'rxjs';
import { startTestSdk } from '../test/test-sdk.js';
import { currentFlowId } from './flow.js';
import { currentInterface } from './interface.js';
import { MessageFlowInterceptor } from './message-flow.interceptor.js';

describe('MessageFlowInterceptor', () => {
  const sdk = startTestSdk();
  afterAll(() => sdk.stop());

  /** Runs a handler of the given kind through the interceptor; it answers the flow and the interface it ran in. */
  function handle(type: 'rpc' | 'http') {
    const executionContext = { getType: () => type } as ExecutionContext;
    const handler: CallHandler = { handle: () => defer(() => of({ flowId: currentFlowId(), name: currentInterface() })) };
    return lastValueFrom(new MessageFlowInterceptor().intercept(executionContext, handler));
  }

  it('runs a message handler in a flow, and in the rabbitmq interface when the message carries none', async () => {
    const { flowId, name } = await handle('rpc');

    expect(flowId).toBeDefined();
    expect(name).toBe('rabbitmq');
  });

  it('leaves HTTP requests to FlowMiddleware and InterfaceMiddleware', async () => {
    expect(await handle('http')).toEqual({ flowId: undefined, name: undefined });
  });
});
