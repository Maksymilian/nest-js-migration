import { DomainError } from '@app/ddd';

export class InvalidSerialNumber extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: string) {
    super(`"${value}" is not a serial number: 1 to 64 letters, digits or dashes`);
  }
}
