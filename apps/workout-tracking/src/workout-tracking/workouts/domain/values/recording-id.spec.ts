import { InvalidRecordingId } from '../errors/invalid-recording-id.js';
import { RecordingId } from './recording-id.js';

describe('RecordingId', () => {
  it('is compared by value', () => {
    expect(RecordingId.from('rec-1').equals(RecordingId.from('rec-1'))).toBe(true);
  });

  it.each(['', ' rec-1', 'x'.repeat(129)])('refuses %j', (value) => {
    expect(() => RecordingId.from(value)).toThrow(InvalidRecordingId);
  });
});
