import { InvalidMemberId } from '../errors/invalid-member-id.js';
import { MemberId } from './member-id.js';

describe('MemberId', () => {
  it('is compared by value', () => {
    expect(MemberId.from('ada@example.com').equals(MemberId.from('ada@example.com'))).toBe(true);
  });

  it.each(['', 'ada lovelace'])('refuses %j', (value) => {
    expect(() => MemberId.from(value)).toThrow(InvalidMemberId);
  });
});
