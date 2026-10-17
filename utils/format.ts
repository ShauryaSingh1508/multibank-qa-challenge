/** Parsers for values the UI renders as display strings. */

/** `$81,674.90` -> 81674.9 */
export function parsePrice(text: string): number {
  return Number(text.replace(/[^0-9.-]/g, ''));
}

/** `2.44%` -> 2.44 */
export function parsePercent(text: string): number {
  return Number(text.replace(/[^0-9.-]/g, ''));
}

/** Relative difference between two numbers, in percent. */
export function percentDiff(a: number, b: number): number {
  return (Math.abs(a - b) / Math.max(Math.abs(b), Number.EPSILON)) * 100;
}

export function isSorted(values: number[], order: 'asc' | 'desc'): boolean {
  return values.every((v, i) => i === 0 || (order === 'desc' ? values[i - 1] >= v : values[i - 1] <= v));
}
