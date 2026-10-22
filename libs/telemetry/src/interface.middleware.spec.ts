import { startTestSdk } from '../test/test-sdk.js';
import { currentInterface } from './interface.js';
import { InterfaceMiddleware } from './interface.middleware.js';

describe('InterfaceMiddleware', () => {
  const sdk = startTestSdk();
  afterAll(() => sdk.stop());

  it('runs the rest of the request in its interface', () => {
    let name: string | undefined;

    new InterfaceMiddleware('graphql').use({}, {}, () => {
      name = currentInterface();
    });

    expect(name).toBe('graphql');
    expect(currentInterface()).toBeUndefined();
  });

  it('leaves the interface a more specific path set', () => {
    let name: string | undefined;

    new InterfaceMiddleware('telegram').use({}, {}, () =>
      new InterfaceMiddleware('rest').use({}, {}, () => {
        name = currentInterface();
      }),
    );

    expect(name).toBe('telegram');
  });
});
