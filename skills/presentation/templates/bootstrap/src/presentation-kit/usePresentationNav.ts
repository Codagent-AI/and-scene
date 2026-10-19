import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN_PX } from './constants'
import type { Mode } from './types'

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  ...[
    'button', 'link', 'checkbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio',
    'slider', 'spinbutton', 'switch', 'tab', 'tablist', 'textbox', 'combobox', 'listbox', 'searchbox', 'treeitem', 'scrollbar',
    'grid', 'gridcell', 'row', 'rowheader', 'columnheader', 'tree', 'treegrid', 'menu', 'menubar', 'toolbar', 'radiogroup', 'application', 'dialog',
  ].map((role) => `[role="${role}"]`),
].join(',')

function targetsInteractiveControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, index))
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
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(0, count - 1)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || targetsInteractiveControl(e.target)) return
      if (NEXT_KEYS.has(e.key)) {
        e.preventDefault()
        next()
      } else if (PREV_KEYS.has(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === 'p' || e.key === 'P') {
        toggleMode()
      }
    }
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index: clampIndex(index, count), mode, next, prev, goTo, setMode, toggleMode }
}
