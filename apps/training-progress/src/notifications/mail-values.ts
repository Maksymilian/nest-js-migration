/** Formats the published language's numbers for people: what a template shows. */
export const MailValues = {
  quantity(kind: string, value: number): string {
    switch (kind) {
      case 'LONGEST_DISTANCE':
      case 'DISTANCE':
        return `${(value / 1000).toFixed(1)} km`;
      case 'LONGEST_DURATION':
      case 'DURATION':
        return MailValues.duration(value);
      case 'MOST_CALORIES':
      case 'CALORIES':
        return `${value} kcal`;
      default:
        return `${value} workouts`;
    }
  },

  duration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return hours > 0 ? `${hours} h ${String(minutes).padStart(2, '0')} min` : `${minutes} min`;
  },

  recordMetric(metric: string): string {
    return { LONGEST_DISTANCE: 'longest distance', LONGEST_DURATION: 'longest duration', MOST_CALORIES: 'most calories' }[metric] ?? metric;
  },

  discipline(discipline: string | null): string {
    return discipline ? discipline.charAt(0) + discipline.slice(1).toLowerCase() : 'any discipline';
  },

  date(iso: string): string {
    return new Date(iso).toISOString().slice(0, 10);
  },
};
