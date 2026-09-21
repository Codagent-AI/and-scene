import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

export type NavigationDirection = 'next' | 'previous' | 'toggle-mode' | false

export function clampStepIndex(index: number, stepCount: number): number {
  return Math.max(0, Math.min(Math.max(stepCount - 1, 0), index))
}

export function isNavigationKey(key: string): NavigationDirection {
  if (key === 'ArrowRight' || key === ' ' || key === 'PageDown') return 'next'
  if (key === 'ArrowLeft' || key === 'PageUp') return 'previous'
  if (key.toLowerCase() === 'p') return 'toggle-mode'
  return false
}

export function shouldHandleNavigationKey(event: Pick<KeyboardEvent, 'key' | 'defaultPrevented' | 'ctrlKey' | 'metaKey' | 'altKey'>): boolean {
  return !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.altKey && Boolean(isNavigationKey(event.key))
}

const isInteractive = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)
}

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [rawIndex, setRawIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<number | null>(null)
  const index = clampStepIndex(rawIndex, stepCount)

  const goTo = useCallback((nextIndex: number) => setRawIndex(clampStepIndex(nextIndex, stepCount)), [stepCount])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleNavigationKey(event) || isInteractive(event.target)) return
      const action = isNavigationKey(event.key)
      if (!action) return
      event.preventDefault()
      if (action === 'next') next()
      if (action === 'previous') previous()
      if (action === 'toggle-mode') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, previous, toggleMode])

  const touchHandlers = {
    onTouchStart: (event: TouchEvent) => { touchStart.current = event.changedTouches[0]?.clientX ?? null },
    onTouchEnd: (event: TouchEvent) => {
      if (touchStart.current === null) return
      const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
      touchStart.current = null
      if (Math.abs(distance) >= 44) (distance < 0 ? next : previous)()
    },
  }

  return { index, mode, goTo, next, previous, toggleMode, touchHandlers }
}
