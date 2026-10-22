import { type ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { GqlArgumentsHost, type GqlContextType } from '@nestjs/graphql';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request } from 'express';
import { GraphQLError } from 'graphql';

/**
 * Reports the rate limit's rejection (section 16) over GraphQL as `TOO_MANY_REQUESTS`, with the HTTP
 * status it stands for and when to try again (seconds, the guard's Retry-After), like
 * @nestjs/resilience's rejections: Apollo would report the guard's exception as INTERNAL_SERVER_ERROR.
 * The response is 429 too: Apollo takes the status from `extensions.http`, and leaves it out of the
 * response. Over HTTP, Nest's own 429.
 */
@Catch(ThrottlerException)
export class RateLimitFilter extends BaseExceptionFilter<ThrottlerException> {
  override catch(exception: ThrottlerException, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() !== 'graphql') {
      return super.catch(exception, host);
    }
    const { req } = GqlArgumentsHost.create(host).getContext<{ req: Request }>();
    const retryAfter = Number(req.res?.getHeader('Retry-After'));
    return new GraphQLError('Too many requests', {
      extensions: {
        code: 'TOO_MANY_REQUESTS',
        httpStatus: HttpStatus.TOO_MANY_REQUESTS,
        ...(retryAfter > 0 ? { retryAfter } : {}),
        http: { status: HttpStatus.TOO_MANY_REQUESTS },
      },
    });
  }
}
