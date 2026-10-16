export const NEXT_KEYS = ['ArrowRight', ' ', 'PageDown']
export const PREV_KEYS = ['ArrowLeft', 'PageUp']
export const SWIPE_MIN = 50

export const clamp = (i: number, count: number) => Math.min(Math.max(i, 0), Math.max(count - 1, 0))

/** Keys belong to interactive controls when one has focus. */
export function isInteractive(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.isContentEditable ||
    el.closest('a[href], button, input, select, textarea, summary, [role="button"], [contenteditable="true"]') !== null
  )
}

/** Returns -1 / +1 for a horizontal swipe (left advances), 0 otherwise. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return 0
  return dx < 0 ? 1 : -1
}

/** Index of each era's first step, in order of appearance. */
export function eraStarts(eras: readonly string[]): { era: string; index: number }[] {
  const out: { era: string; index: number }[] = []
  eras.forEach((era, index) => {
    if (out.length === 0 || out[out.length - 1].era !== era) out.push({ era, index })
  })
  return out
}
