import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

export interface UsePresentationNavOptions {
  stepCount: number
  initialMode?: PresentationMode
}

export interface UsePresentationNavResult {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
  setMode: (mode: PresentationMode) => void
  /** Callback ref; attach to the stage element to enable touch-swipe navigation. */
  stageRef: (node: HTMLElement | null) => void
}

const SWIPE_THRESHOLD_PX = 40

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'])

function isFocusedOnControl(): boolean {
  const active = document.activeElement
  if (!active) return false
  if (INTERACTIVE_TAGS.has(active.tagName)) return true
  return active.hasAttribute('contenteditable')
}

function clamp(index: number, stepCount: number): number {
  if (stepCount <= 0) return 0
  return Math.min(Math.max(index, 0), stepCount - 1)
}

export function usePresentationNav({
  stepCount,
  initialMode = 'browse',
}: UsePresentationNavOptions): UsePresentationNavResult {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const [stageNode, setStageNode] = useState<HTMLElement | null>(null)
  const stageRef = useCallback((node: HTMLElement | null) => {
    setStageNode(node)
  }, [])
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback(
    (target: number) => {
      setIndex(clamp(target, stepCount))
    },
    [stepCount],
  )

  const next = useCallback(() => {
    setIndex((current) => clamp(current + 1, stepCount))
  }, [stepCount])

  const prev = useCallback(() => {
    setIndex((current) => clamp(current - 1, stepCount))
  }, [stepCount])

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'browse' ? 'present' : 'browse'))
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isFocusedOnControl()) return

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
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
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev, toggleMode])

  useEffect(() => {
    const node = stageNode
    if (!node) return

    function handleTouchStart(event: TouchEvent) {
      touchStartX.current = event.touches[0]?.clientX ?? null
    }

    function handleTouchEnd(event: TouchEvent) {
      const startX = touchStartX.current
      touchStartX.current = null
      if (startX == null) return

      const endX = event.changedTouches[0]?.clientX ?? startX
      const deltaX = endX - startX

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return
      if (deltaX < 0) next()
      else prev()
    }

    node.addEventListener('touchstart', handleTouchStart)
    node.addEventListener('touchend', handleTouchEnd)
    return () => {
      node.removeEventListener('touchstart', handleTouchStart)
      node.removeEventListener('touchend', handleTouchEnd)
    }
  }, [stageNode, next, prev])

  return { index, mode, next, prev, goTo, toggleMode, setMode, stageRef }
}
