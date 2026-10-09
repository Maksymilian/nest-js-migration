import { InvalidSerialNumber } from '../errors/invalid-serial-number.js';
import { SerialNumber } from './serial-number.js';

describe('SerialNumber', () => {
  it('is upper case, so serial numbers that differ in case are equal', () => {
    expect(SerialNumber.from(' bk-001 ').equals(SerialNumber.from('BK-001'))).toBe(true);
  });

  it.each(['', '-BK', 'BK 001', 'X'.repeat(65)])('refuses %j', (value) => {
    expect(() => SerialNumber.from(value)).toThrow(InvalidSerialNumber);
  });
});
