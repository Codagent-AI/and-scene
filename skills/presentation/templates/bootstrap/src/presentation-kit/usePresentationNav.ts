import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './types.ts'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

const SWIPE_MIN = 50

const KEY_ACTIONS: Record<string, NavAction> = {
  ArrowRight: 'next',
  ' ': 'next',
  PageDown: 'next',
  ArrowLeft: 'prev',
  PageUp: 'prev',
  p: 'toggle-mode',
  P: 'toggle-mode',
}

const WIDGET_ROLES = ['button', 'link', 'slider', 'spinbutton', 'combobox', 'listbox', 'option', 'textbox', 'searchbox', 'menu', 'menuitem', 'menubar', 'tab', 'tablist', 'radio', 'radiogroup', 'checkbox', 'switch', 'tree', 'treeitem', 'grid', 'gridcell', 'scrollbar']
  .map((r) => `[role="${r}"]`)
  .join(',')
const INTERACTIVE = `a[href],button,input,select,textarea,summary,audio[controls],video[controls],[contenteditable]:not([contenteditable="false"]),${WIDGET_ROLES}`

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0))
}

export function actionForKey(key: string): NavAction | undefined {
  return KEY_ACTIONS[key]
}

/** Horizontal swipe: left advances, right goes back; mostly-vertical drags are ignored. */
export function swipeAction(dx: number, dy: number): NavAction | undefined {
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return undefined
  return dx < 0 ? 'next' : 'prev'
}

/** True when the event target is a control that owns navigation keys itself. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE) !== null
}

export interface NavOptions {
  count: number
  initialMode?: Mode
}

export function usePresentationNav({ count, initialMode = 'present' }: NavOptions) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  useEffect(() => {
    const run = (action: NavAction | undefined) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else if (action === 'toggle-mode') toggleMode()
    }
    const onKey = (e: KeyboardEvent) => {
      // A control that already handled the key (preventDefault) keeps it.
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isInteractiveTarget(e.target)) return
      const action = actionForKey(e.key)
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
      run(swipeAction(t.clientX - start.x, t.clientY - start.y))
      start = null
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

  return { index, mode, goTo, next, prev, toggleMode, setMode }
}
