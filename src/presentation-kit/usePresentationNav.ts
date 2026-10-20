import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN } from './constants.ts'
import type { Mode } from './types.ts'

const INTERACTIVE = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  ...[
    'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
    'slider', 'spinbutton', 'textbox', 'searchbox', 'combobox', 'listbox', 'menu', 'menubar', 'tablist', 'tree',
    'treegrid', 'grid', 'gridcell', 'treeitem', 'scrollbar',
  ].map(
    (role) => `[role="${role}"]`,
  ),
].join(',')

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode = 'present'): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(0, count - 1)

  const goTo = useCallback((i: number) => setIndex(Math.min(last, Math.max(0, i))), [last])
  // A stored index past the end (the step list shrank) counts as the last step.
  const next = useCallback(() => setIndex((i) => Math.min(last, Math.min(i, last) + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, Math.min(i, last) - 1)), [last])
  const toggleMode = useCallback(() => setMode((m) => (m === 'present' ? 'browse' : 'present')), [])

  // Keep the position valid when the step list shrinks.
  const clamped = Math.min(index, last)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isInteractive(e.target)) return
      if (NEXT_KEYS.has(e.key)) next()
      else if (PREV_KEYS.has(e.key)) prev()
      else if (e.key === 'p' || e.key === 'P') toggleMode()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onEnd = (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [next, prev])

  return { index: clamped, mode, next, prev, goTo, toggleMode }
}
