import { UnknownPeriodKind } from '../errors/unknown-period-kind.js';
import { TrainingPeriod, utcDay } from './training-period.js';

describe('TrainingPeriod', () => {
  const thursday = new Date('2026-10-08T23:30:00Z');

  it('is the ISO week, Monday to Sunday, in UTC', () => {
    const week = TrainingPeriod.containing('WEEK', thursday);

    expect(week.start.toISOString()).toBe('2026-10-05T00:00:00.000Z');
    expect(week.end.toISOString()).toBe('2026-10-12T00:00:00.000Z');
  });

  it('is the calendar month and year in UTC, end exclusive', () => {
    expect(TrainingPeriod.containing('MONTH', thursday)).toMatchObject({
      start: new Date('2026-10-01T00:00:00Z'),
      end: new Date('2026-11-01T00:00:00Z'),
    });
    expect(TrainingPeriod.containing('YEAR', thursday)).toMatchObject({
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2027-01-01T00:00:00Z'),
    });
  });

  it('contains its start but not its end', () => {
    const month = TrainingPeriod.containing('MONTH', thursday);

    expect(month.contains(new Date('2026-10-01T00:00:00Z'))).toBe(true);
    expect(month.contains(new Date('2026-11-01T00:00:00Z'))).toBe(false);
  });

  it('lists the week, month and year that contain a date', () => {
    expect(TrainingPeriod.allContaining(thursday).map((period) => period.kind)).toEqual(['WEEK', 'MONTH', 'YEAR']);
  });

  it('refuses an unknown period kind', () => {
    expect(() => TrainingPeriod.periodKind('DECADE')).toThrow(UnknownPeriodKind);
  });

  it('finds the UTC day of an instant', () => {
    expect(utcDay(thursday).toISOString()).toBe('2026-10-08T00:00:00.000Z');
  });
});
