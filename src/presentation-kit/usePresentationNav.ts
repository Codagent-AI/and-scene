import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN } from './constants.ts'
import type { Mode } from './types.ts'

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
].join(',')

export function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export function clamp(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}

type Action = 'next' | 'prev' | 'mode'

const KEY_ACTIONS: Record<string, Action> = {
  ArrowRight: 'next',
  ' ': 'next',
  PageDown: 'next',
  ArrowLeft: 'prev',
  PageUp: 'prev',
  p: 'mode',
  P: 'mode',
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

/** Keyboard, touch and programmatic navigation. Clamps at both ends; never wraps. */
export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const countRef = useRef(count)
  useEffect(() => {
    countRef.current = count
  }, [count])

  const goTo = useCallback((i: number) => setIndex(clamp(i, countRef.current)), [])
  const next = useCallback(() => setIndex((i) => clamp(i + 1, countRef.current)), [])
  const prev = useCallback(() => setIndex((i) => clamp(i - 1, countRef.current)), [])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      const action = KEY_ACTIONS[event.key]
      if (!action) return
      if (isInteractive(event.target) || isInteractive(document.activeElement)) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }

    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch && !isInteractive(event.target) ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const origin = start
      start = null
      if (!origin || !touch) return
      const dx = touch.clientX - origin.x
      const dy = touch.clientY - origin.y
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
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

  return { index: clamp(rawIndex, count), mode, next, prev, goTo, setMode, toggleMode }
}
