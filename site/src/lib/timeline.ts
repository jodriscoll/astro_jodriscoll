// The resume timeline's readout shows age at each point on the line when this
// is set. Leave it null to show only the year count.
export const BORN_YEAR: number | null = 1984;
// Birth month (1–12). The age only ticks over once this month is reached.
export const BORN_MONTH = 12;

/** Whole years of age at a date, counting the birthday from BORN_MONTH. */
export function ageAt(date: Date): number | null {
  if (!BORN_YEAR) return null;
  const age = date.getUTCFullYear() - BORN_YEAR;
  return date.getUTCMonth() + 1 < BORN_MONTH ? age - 1 : age;
}
