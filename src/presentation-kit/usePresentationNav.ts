import { useCallback, useEffect, useState } from 'react'
import { SWIPE_MIN_PX } from './constants'
import type { Mode } from './types'

const INTERACTIVE_ROLES = [
  'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'checkbox', 'radio',
  'switch', 'slider', 'spinbutton', 'textbox', 'searchbox', 'combobox', 'listbox', 'option', 'treeitem',
  // composite widgets that own arrow-key navigation
  'grid', 'gridcell', 'treegrid', 'tree', 'tablist', 'menu', 'menubar', 'radiogroup', 'toolbar', 'scrollbar',
  'row', 'rowheader', 'columnheader',
]
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  ...INTERACTIVE_ROLES.map((role) => `[role="${role}"]`),
].join(',')

/** True when the event target is (inside) a control that owns navigation keys. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
}

export function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)))
}

export function swipeDirection(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export interface NavOptions {
  count: number
  initialMode?: Mode
  initialIndex?: number
}

export interface Nav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: Mode) => void
  toggleMode: () => void
}

export function usePresentationNav({ count, initialMode = 'present', initialIndex = 0 }: NavOptions): Nav {
  const [rawIndex, setIndex] = useState(initialIndex)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'present' ? 'browse' : 'present')), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          event.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          prev()
          break
        case 'p':
        case 'P':
          toggleMode()
          break
      }
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y)
      start = null
      if (direction === 'next') next()
      else if (direction === 'prev') prev()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, setMode, toggleMode }
}
