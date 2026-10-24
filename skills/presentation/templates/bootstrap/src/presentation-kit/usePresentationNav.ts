import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MODE } from './constants.ts'
import { clampIndex, isInteractiveTarget, swipeDirection } from './model.ts'
import type { Mode } from './types.ts'

const NEXT_KEYS = new Set(['ArrowRight', ' ', 'PageDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp'])

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setMode: (mode: Mode) => void
  toggleMode: () => void
}

/** Keyboard, touch and mode state. Navigation clamps at both ends. */
export function usePresentationNav(count: number, initialMode: Mode = DEFAULT_MODE): PresentationNav {
  const [state, setState] = useState<{ index: number; mode: Mode }>({ index: 0, mode: initialMode })
  const index = clampIndex(state.index, count)

  const goTo = useCallback(
    (target: number) => setState((s) => ({ ...s, index: clampIndex(target, count) })),
    [count],
  )
  const next = useCallback(
    () => setState((s) => ({ ...s, index: clampIndex(clampIndex(s.index, count) + 1, count) })),
    [count],
  )
  const prev = useCallback(
    () => setState((s) => ({ ...s, index: clampIndex(clampIndex(s.index, count) - 1, count) })),
    [count],
  )
  const setMode = useCallback((mode: Mode) => setState((s) => ({ ...s, mode })), [])
  const toggleMode = useCallback(
    () => setState((s) => ({ ...s, mode: s.mode === 'browse' ? 'present' : 'browse' })),
    [],
  )

  const actions = useRef({ next, prev, toggleMode })
  useEffect(() => {
    actions.current = { next, prev, toggleMode }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (isInteractiveTarget(event.target)) return
      const { key } = event
      if (NEXT_KEYS.has(key)) actions.current.next()
      else if (PREV_KEYS.has(key)) actions.current.prev()
      else if (key === 'p' || key === 'P') actions.current.toggleMode()
      else return
      event.preventDefault()
    }

    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y)
      start = null
      if (direction === 1) actions.current.next()
      else if (direction === -1) actions.current.prev()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return { index, mode: state.mode, next, prev, goTo, setMode, toggleMode }
}
