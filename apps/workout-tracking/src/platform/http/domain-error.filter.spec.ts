import { DomainError } from '@app/ddd';
import type { ArgumentsHost } from '@nestjs/common';
import { DomainErrorFilter } from './domain-error.filter.js';

class EquipmentNotFound extends DomainError {
  readonly kind = 'not-found';
}
class WorkoutVoided extends DomainError {
  readonly kind = 'conflict';
}
class InvalidWorkoutMetrics extends DomainError {
  readonly kind = 'invariant-violation';
}

function respond(error: DomainError) {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;
  new DomainErrorFilter().catch(error, host);
  return response;
}

describe('DomainErrorFilter', () => {
  it.each([
    [new EquipmentNotFound('Equipment 1 is not registered'), 404],
    [new WorkoutVoided('Workout 1 is voided'), 409],
    [new InvalidWorkoutMetrics('duration must be more than 0'), 422],
  ])('reports %s as %i', (error, status) => {
    const response = respond(error);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({ statusCode: status, code: error.name, message: error.message });
  });
});
