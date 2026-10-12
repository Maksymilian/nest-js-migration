import { DomainError, type DomainErrorKind } from '@app/ddd';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { GqlContextType } from '@nestjs/graphql';
import type { Response } from 'express';
import { GraphQLError } from 'graphql';

const GRAPHQL_CODE: Record<DomainErrorKind, string> = {
  'not-found': 'NOT_FOUND',
  conflict: 'CONFLICT',
  'invariant-violation': 'INVARIANT_VIOLATION',
};

const HTTP_STATUS: Record<DomainErrorKind, HttpStatus> = {
  'not-found': HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  'invariant-violation': HttpStatus.UNPROCESSABLE_ENTITY,
};

/**
 * Reports a broken business rule: over GraphQL as an error with `extensions.code` (`NOT_FOUND`,
 * `CONFLICT`, `INVARIANT_VIOLATION`) and the domain error's name, over HTTP as 404, 409 or 422.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() === 'graphql') {
      return new GraphQLError(error.message, { extensions: { code: GRAPHQL_CODE[error.kind], reason: error.name } });
    }
    const statusCode = HTTP_STATUS[error.kind];
    host.switchToHttp().getResponse<Response>().status(statusCode).json({ statusCode, code: error.name, message: error.message });
    return undefined;
  }
}
