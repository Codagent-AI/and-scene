import { useCallback, useEffect, useState } from 'react'
import { SWIPE_THRESHOLD } from './constants.ts'
import type { Mode } from './types.ts'

export type NavAction = 'next' | 'prev' | 'toggle-mode'

const KEY_ACTIONS: Record<string, NavAction> = {
  ArrowRight: 'next',
  ' ': 'next',
  PageDown: 'next',
  ArrowLeft: 'prev',
  PageUp: 'prev',
  p: 'toggle-mode',
  P: 'toggle-mode',
}

export const actionForKey = (key: string): NavAction | undefined => KEY_ACTIONS[key]

/** A mostly-horizontal drag past the threshold: left advances, right goes back. */
export function actionForSwipe(dx: number, dy: number): NavAction | undefined {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return undefined
  return dx < 0 ? 'next' : 'prev'
}

const INTERACTIVE_ROLES = [
  'button', 'link', 'textbox', 'searchbox', 'combobox', 'listbox', 'option', 'slider', 'spinbutton', 'checkbox', 'radio',
  'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'treeitem',
]

const INTERACTIVE = [
  'button', 'a', 'input', 'textarea', 'select', 'summary', '[contenteditable=""]', '[contenteditable="true"]',
  ...INTERACTIVE_ROLES.map((role) => `[role="${role}"]`),
].join(', ')

/** Focused controls keep their own keys. */
export const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest(INTERACTIVE) !== null

export function usePresentationNav(count: number, initialMode: Mode) {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(0, count - 1)
  const index = Math.min(rawIndex, last)

  const goTo = useCallback(
    (target: number) => setIndex(Math.min(Math.max(0, target), last)),
    [last],
  )
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    const run = (action: NavAction) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      const action = actionForKey(event.key)
      if (!action) return
      event.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | undefined
    const onTouchStart = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : undefined
    }
    const onTouchEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      const from = start
      start = undefined
      if (!t || !from) return
      const action = actionForSwipe(t.clientX - from.x, t.clientY - from.y)
      if (action) run(action)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, count, goTo, next, prev, setMode, toggleMode }
}
