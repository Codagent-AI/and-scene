import { useCallback, useEffect, useState } from 'react'
import { clampIndex } from './steps'
import type { Mode } from './types'

const NEXT_KEYS = ['ArrowRight', ' ', 'PageDown']
const PREV_KEYS = ['ArrowLeft', 'PageUp']
const SWIPE_MIN = 40

const INTERACTIVE = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"],[role="slider"],[role="textbox"],[role="searchbox"],[role="spinbutton"],[role="combobox"],[role="listbox"],[role="option"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="menuitem"],[role="scrollbar"]',
].join(',')

/** True when the key event target is a control that owns its own keyboard behavior. */
export function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return (target instanceof HTMLElement && target.isContentEditable) || target.closest(INTERACTIVE) !== null
}

export interface Nav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (i: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse'): Nav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      // Focused controls keep their own key behavior.
      if (isInteractiveTarget(e.target)) return
      if (NEXT_KEYS.includes(e.key)) {
        e.preventDefault()
        next()
      } else if (PREV_KEYS.includes(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === 'p' || e.key === 'P') {
        toggleMode()
      }
    }
    let startX = 0
    let startY = 0
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) next()
      else prev()
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
