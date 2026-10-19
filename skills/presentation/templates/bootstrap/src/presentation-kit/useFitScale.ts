import { useSyncExternalStore } from 'react'
import type { PresentationMode } from './constants'
import { stageScale } from './fitScale'

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

export function useViewportSize() {
  const width = useSyncExternalStore(subscribe, () => window.innerWidth)
  const height = useSyncExternalStore(subscribe, () => window.innerHeight)
  return { width, height }
}

/** Fit scale for the active mode; recalculated on resize and mode change only. */
export function useFitScale(mode: PresentationMode, designWidth?: number, designHeight?: number) {
  const viewport = useViewportSize()
  return { viewport, scale: stageScale(mode, viewport, designWidth, designHeight) }
}
