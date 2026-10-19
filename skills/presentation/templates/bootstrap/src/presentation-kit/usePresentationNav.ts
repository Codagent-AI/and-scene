import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN_PX } from './constants.ts'
import type { Mode } from './constants.ts'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])
const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'])
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'checkbox', 'radio',
  'switch', 'slider', 'spinbutton', 'textbox', 'combobox', 'listbox', 'searchbox', 'scrollbar', 'treeitem',
])

function isInteractive(target: EventTarget | null): boolean {
  const start = target instanceof Element ? target : null
  for (let n: Element | null = start; n; n = n.parentElement) {
    if (INTERACTIVE_TAGS.has(n.tagName)) return true
    const editable = n.getAttribute('contenteditable')
    if (editable !== null && editable !== 'false') return true
    const role = n.getAttribute('role')
    if (role && INTERACTIVE_ROLES.has(role)) return true
  }
  return false
}

export type KeyAction = 'next' | 'prev' | 'toggle-mode' | null

/** What a keydown means for the deck; null when it belongs to someone else. */
export function keyAction(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'target'>): KeyAction {
  if (e.ctrlKey || e.altKey || e.metaKey) return null
  const action: KeyAction = NEXT_KEYS.has(e.key) ? 'next' : PREV_KEYS.has(e.key) ? 'prev' : e.key === 'p' || e.key === 'P' ? 'toggle-mode' : null
  if (!action) return null
  if (isInteractive(e.target) || isInteractive(document.activeElement)) return null
  return action
}

/** Horizontal swipe: left advances, right goes back; short or vertical-dominant gestures are ignored. */
export function swipeAction(dx: number, dy: number): 'next' | 'prev' | null {
  if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export const clampIndex = (i: number, count: number) => Math.max(0, Math.min(i, count - 1))

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])
  const touch = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const run = (a: KeyAction | 'next' | 'prev' | null) => {
      if (a === 'next') next()
      else if (a === 'prev') prev()
      else if (a === 'toggle-mode') toggleMode()
    }
    const onKey = (e: KeyboardEvent) => {
      const action = keyAction(e)
      if (!action) return
      if (e.key === ' ' || e.key.startsWith('Page')) e.preventDefault()
      run(action)
    }
    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      touch.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const start = touch.current
      touch.current = null
      if (t && start) run(swipeAction(t.clientX - start.x, t.clientY - start.y))
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

  return { index, mode, next, prev, goTo, toggleMode }
}
