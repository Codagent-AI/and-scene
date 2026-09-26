export function clampStepIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}
