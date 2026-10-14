import { useSyncExternalStore } from 'react'
import { WIDE_VIEWPORT } from './constants'
import { computeFitScale, stageRect, type StageRect } from './geometry'
import type { PresentationMode } from './types'

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/**
 * Re-renders only on viewport resize or mode change. Step navigation does not
 * change the scale, so layout morphs stay clean within a mode.
 */
export function useFitScale(mode: PresentationMode): { scale: number; rect: StageRect; wide: boolean } {
  // Snapshots must be primitives: an object snapshot is a new value per read.
  const width = useSyncExternalStore(subscribe, () => window.innerWidth, () => 0)
  const height = useSyncExternalStore(subscribe, () => window.innerHeight, () => 0)
  const size = { viewportWidth: width, viewportHeight: height, mode }
  return {
    scale: computeFitScale(size),
    rect: stageRect(size),
    wide: width >= WIDE_VIEWPORT,
  }
}
