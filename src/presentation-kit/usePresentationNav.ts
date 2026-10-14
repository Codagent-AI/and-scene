import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { clampIndex, isInteractiveTarget, navActionForKey, swipeAction, type NavAction } from './nav'
import type { PresentationMode } from './types'

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  /** Spread onto the presentation root for horizontal swipe navigation. */
  touchHandlers: {
    onTouchStart: (event: TouchEvent<HTMLElement>) => void
    onTouchEnd: (event: TouchEvent<HTMLElement>) => void
  }
}

interface NavState {
  index: number
  mode: PresentationMode
}

export function usePresentationNav({
  count,
  initialMode,
}: {
  count: number
  initialMode: PresentationMode
}): PresentationNav {
  const [state, setState] = useState<NavState>({ index: 0, mode: initialMode })
  const index = clampIndex(state.index, count)

  const next = useCallback(() => {
    setState((current) => ({ ...current, index: clampIndex(current.index + 1, count) }))
  }, [count])

  const prev = useCallback(() => {
    setState((current) => ({ ...current, index: clampIndex(current.index - 1, count) }))
  }, [count])

  const goTo = useCallback(
    (target: number) => {
      setState((current) => ({ ...current, index: clampIndex(target, count) }))
    },
    [count],
  )

  const toggleMode = useCallback(() => {
    setState((current) => ({
      ...current,
      mode: current.mode === 'browse' ? 'present' : 'browse',
    }))
  }, [])

  const dispatch = useCallback(
    (action: NavAction) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    },
    [next, prev, toggleMode],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (isInteractiveTarget(event.target)) return
      const action = navActionForKey(event.key)
      if (!action) return
      event.preventDefault()
      dispatch(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  const swipeStart = useRef<{ x: number; y: number; ignore: boolean } | null>(null)

  const onTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    swipeStart.current = touch
      ? { x: touch.clientX, y: touch.clientY, ignore: isInteractiveTarget(event.target) }
      : null
  }, [])

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const start = swipeStart.current
      swipeStart.current = null
      const touch = event.changedTouches[0]
      if (!start || start.ignore || !touch) return
      const action = swipeAction(touch.clientX - start.x, touch.clientY - start.y)
      if (action) dispatch(action)
    },
    [dispatch],
  )

  return {
    index,
    mode: state.mode,
    next,
    prev,
    goTo,
    toggleMode,
    touchHandlers: { onTouchStart, onTouchEnd },
  }
}
