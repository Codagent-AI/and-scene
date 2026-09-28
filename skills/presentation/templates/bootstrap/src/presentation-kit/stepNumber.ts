/** On-screen step number, derived from position so reordering needs no renumbering. */
export function stepNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}
