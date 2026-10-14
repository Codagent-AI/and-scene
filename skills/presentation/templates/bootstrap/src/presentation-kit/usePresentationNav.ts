import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

export const SWIPE_THRESHOLD = 50

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(count - 1, 0)))
}

export function keyToAction(key: string): NavAction | null {
  switch (key) {
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
      return 'next'
    case 'ArrowLeft':
    case 'PageUp':
      return 'prev'
    case 'p':
    case 'P':
      return 'toggle-mode'
    default:
      return null
  }
}

/** Left swipe (negative dx) advances; right swipe goes back; mostly-vertical gestures are ignored. */
export function classifySwipe(
  dx: number,
  dy: number,
  threshold = SWIPE_THRESHOLD,
): 'next' | 'prev' | null {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return null
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="link"], [role="tab"], [role="slider"], [role="textbox"]'

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

/** Distinct eras in order of first appearance, with their first step index. */
export function eraEntries(
  steps: readonly { era: string }[],
): { era: string; firstIndex: number }[] {
  const seen = new Set<string>()
  const out: { era: string; firstIndex: number }[] = []
  steps.forEach((s, i) => {
    if (!seen.has(s.era)) {
      seen.add(s.era)
      out.push({ era: s.era, firstIndex: i })
    }
  })
  return out
}

/** On-screen step number, derived from position. */
export function stepNumber(index: number): number {
  return index + 1
}

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: Mode) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const next = useCallback(
    () => setIndex((i) => clampIndex(clampIndex(i, count) + 1, count)),
    [count],
  )
  const prev = useCallback(
    () => setIndex((i) => clampIndex(clampIndex(i, count) - 1, count)),
    [count],
  )
  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const run = (action: NavAction) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isInteractiveTarget(e.target)) return
      const action = keyToAction(e.key)
      if (!action) return
      e.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const action = classifySwipe(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action) run(action)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, setMode, toggleMode }
}
