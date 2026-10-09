/**
 * How the interface layer reports a domain error: `404`, `409` or `422` over REST, and
 * `NOT_FOUND`, `CONFLICT` or `INVARIANT_VIOLATION` over GraphQL.
 */
export type DomainErrorKind = 'not-found' | 'conflict' | 'invariant-violation';

/** A broken business rule, thrown by an aggregate or a value object. */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
