/** Pure navigation helpers shared by the nav hook and chrome. */
export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(Math.max(index, 0), count - 1)
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return (
    target.closest(
      'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="tab"], [role="slider"]',
    ) !== null
  )
}

export function firstIndexOfEra(eras: readonly string[], era: string): number {
  return Math.max(0, eras.indexOf(era))
}

export type SwipeDirection = 'next' | 'prev' | null

/** Horizontal-dominant swipes beyond `minDistance` navigate; others are ignored. */
export function classifySwipe(dx: number, dy: number, minDistance: number): SwipeDirection {
  if (Math.abs(dx) < minDistance || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}
