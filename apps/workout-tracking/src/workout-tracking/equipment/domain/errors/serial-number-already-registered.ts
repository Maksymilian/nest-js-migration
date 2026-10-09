import { DomainError } from '@app/ddd';

export class SerialNumberAlreadyRegistered extends DomainError {
  readonly kind = 'conflict';

  constructor(serialNumber: string) {
    super(`Equipment with serial number ${serialNumber} is already registered`);
  }
}
