import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

const isInteractive = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest('a, button, input, select, textarea, [contenteditable="true"]'))

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
}

export function usePresentationNav(
  stepCount: number,
  initialMode: PresentationMode = 'browse',
): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const lastIndex = Math.max(0, stepCount - 1)
  const normalizedIndex = Math.min(index, lastIndex)
  const goTo = useCallback((nextIndex: number) => {
    setIndex(Math.max(0, Math.min(lastIndex, nextIndex)))
  }, [lastIndex])
  const next = useCallback(() => {
    setIndex((current) => Math.min(lastIndex, current + 1))
  }, [lastIndex])
  const prev = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1))
  }, [])
  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'browse' ? 'present' : 'browse'))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractive(event.target)) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        prev()
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        toggleMode()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return {
    index: normalizedIndex,
    mode,
    next,
    prev,
    goTo,
    toggleMode,
    onTouchStart: (event) => {
      const touch = event.touches[0]
      if (touch) setTouchStart({ x: touch.clientX, y: touch.clientY })
    },
    onTouchEnd: (event) => {
      const touch = event.changedTouches[0]
      if (!touchStart || !touch) return
      const xDistance = touch.clientX - touchStart.x
      const yDistance = touch.clientY - touchStart.y
      setTouchStart(null)
      if (Math.abs(xDistance) > 48 && Math.abs(xDistance) > Math.abs(yDistance)) {
        if (xDistance < 0) next()
        else prev()
      }
    },
  }
}
