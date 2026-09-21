import { useCallback, useEffect, useRef } from 'react'
import type { TouchEvent } from 'react'
import { getNavigationTarget, type NavigationDirection } from './navigation'
import type { PresentationMode } from './types'

type Options = {
  index: number
  count: number
  mode: PresentationMode
  setIndex: (index: number) => void
  setMode: (mode: PresentationMode) => void
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, [contenteditable="true"]'))
}

export function usePresentationNav({ index, count, mode, setIndex, setMode }: Options) {
  const touchStart = useRef<number | null>(null)
  const go = useCallback((direction: NavigationDirection) => {
    setIndex(getNavigationTarget(index, direction, count))
  }, [count, index, setIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        go('next')
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        go('previous')
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        setMode(mode === 'browse' ? 'present' : 'browse')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [go, mode, setMode])

  return {
    next: () => go('next'),
    previous: () => go('previous'),
    toggleMode: () => setMode(mode === 'browse' ? 'present' : 'browse'),
    onTouchStart: (event: TouchEvent) => { touchStart.current = event.touches[0]?.clientX ?? null },
    onTouchEnd: (event: TouchEvent) => {
      if (touchStart.current === null) return
      const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
      touchStart.current = null
      if (Math.abs(delta) > 48) go(delta < 0 ? 'next' : 'previous')
    },
  }
}
