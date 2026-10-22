import { startTestSdk } from '../test/test-sdk.js';
import { currentFlowId } from './flow.js';
import { FlowMiddleware } from './flow.middleware.js';

describe('FlowMiddleware', () => {
  const sdk = startTestSdk();
  afterAll(() => sdk.stop());

  it('runs the rest of the request in a flow', () => {
    let flowId: string | undefined;

    new FlowMiddleware().use({}, {}, () => {
      flowId = currentFlowId();
    });

    expect(flowId).toBeDefined();
    expect(currentFlowId()).toBeUndefined();
  });
});
