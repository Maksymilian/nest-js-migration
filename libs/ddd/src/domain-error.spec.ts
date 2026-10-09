import { DomainError } from './domain-error.js';

class GoalNotActive extends DomainError {
  readonly kind = 'conflict';
}

describe('DomainError', () => {
  it('is named after its class and keeps its kind', () => {
    const error = new GoalNotActive('The training goal is not active');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GoalNotActive');
    expect(error.kind).toBe('conflict');
    expect(error.message).toBe('The training goal is not active');
  });
});
