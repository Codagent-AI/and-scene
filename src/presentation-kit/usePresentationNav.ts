import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_PX } from './constants.ts'
import type { Mode } from './types.ts'

export type NavAction = 'next' | 'prev' | 'toggle'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])
const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [contenteditable=""], [contenteditable="true"], ' +
  '[role="button"], [role="link"], [role="textbox"], [role="slider"], [role="tab"]'

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface KeyLike {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  target?: EventTarget | null
}

export function actionForKey(event: KeyLike): NavAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (isInteractiveTarget(event.target ?? null)) return null
  if (NEXT_KEYS.has(event.key)) return 'next'
  if (PREV_KEYS.has(event.key)) return 'prev'
  if (event.key === 'p' || event.key === 'P') return 'toggle'
  return null
}

export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    const run = (action: NavAction | null) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else if (action === 'toggle') toggleMode()
    }
    const onKey = (event: KeyboardEvent) => {
      const action = actionForKey(event)
      if (action && action !== 'toggle') event.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onStart = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      if (!start || !t) return
      run(swipeAction(t.clientX - start.x, t.clientY - start.y))
      start = null
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, goTo, next, prev, toggleMode }
}
