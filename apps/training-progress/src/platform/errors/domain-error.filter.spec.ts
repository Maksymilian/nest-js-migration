import { DomainError } from '@app/ddd';
import type { ArgumentsHost } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { DomainErrorFilter } from './domain-error.filter.js';

class GoalNotActive extends DomainError {
  readonly kind = 'conflict';
}

describe('DomainErrorFilter', () => {
  it('turns a domain error into a GraphQL error with its code', () => {
    const host = { getType: () => 'graphql' } as unknown as ArgumentsHost;

    const result = new DomainErrorFilter().catch(new GoalNotActive('Training goal 1 is achieved, not active'), host) as GraphQLError;

    expect(result).toBeInstanceOf(GraphQLError);
    expect(result.extensions).toEqual({ code: 'CONFLICT', reason: 'GoalNotActive' });
  });

  it('answers HTTP requests with the status of its kind', () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = { getType: () => 'http', switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;

    new DomainErrorFilter().catch(new GoalNotActive('not active'), host);

    expect(response.status).toHaveBeenCalledWith(409);
  });
});
