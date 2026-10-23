/** Display number for a step, derived from its position in the step array. */
export function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}
