import { useSyncExternalStore } from 'react'
import { fitScale } from './fit'
import { DESIGN_H, DESIGN_W } from './constants'
import type { Mode } from './types'

/** Uniform fit scale for `mode`, tracking the window size. */
export function useFitScale(mode: Mode, designWidth: number = DESIGN_W, designHeight: number = DESIGN_H): number {
  const viewport = useSyncExternalStore(
    (notify) => {
      window.addEventListener('resize', notify)
      return () => window.removeEventListener('resize', notify)
    },
    () => `${window.innerWidth}x${window.innerHeight}`,
    () => '0x0',
  )
  const [width, height] = viewport.split('x').map(Number)
  return fitScale({ width, height }, mode, designWidth, designHeight)
}
