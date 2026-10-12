import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

export function shouldIgnoreNavigationKey(target: HTMLElement): boolean {
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName) || target.getAttribute?.('role') === 'button'
}
export function clampStep(index: number, stepCount: number): number { return Math.max(0, Math.min(stepCount - 1, index)) }
export type NavigationAction = 'next' | 'prev' | 'toggle' | null
export function navigationKeyAction(key: string, target?: HTMLElement | null): NavigationAction {
  if (target && shouldIgnoreNavigationKey(target)) return null
  if (['ArrowRight', ' ', 'PageDown'].includes(key)) return 'next'
  if (['ArrowLeft', 'PageUp'].includes(key)) return 'prev'
  if (key.toLowerCase() === 'p') return 'toggle'
  return null
}
export function swipeAction(deltaX: number, threshold = 48): 'next' | 'prev' | null {
  if (Math.abs(deltaX) <= threshold) return null
  return deltaX < 0 ? 'next' : 'prev'
}
export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const next = useCallback(() => setIndex((i) => clampStep(i + 1, stepCount)), [stepCount])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goTo = useCallback((i: number) => setIndex(clampStep(i, stepCount)), [stepCount])
  const toggleMode = useCallback(() => setMode((m) => m === 'browse' ? 'present' : 'browse'), [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = navigationKeyAction(event.key, event.target as HTMLElement | null)
      if (action === 'next') { event.preventDefault(); next() }
      else if (action === 'prev') { event.preventDefault(); prev() }
      else if (action === 'toggle') toggleMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleMode])
  return { index, mode, next, prev, goTo, toggleMode, setMode }
}
