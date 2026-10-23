import { useCallback, useSyncExternalStore } from 'react'
import { fitScale } from './fit'
import { DESIGN_H, DESIGN_W } from './constants'
import type { Mode } from './types'

/**
 * Uniform fit scale for `mode`. The width is the stage's own width, so a side column
 * such as the table of contents is excluded. The height is the window height less the
 * mode's fixed chrome reservation, so the scale never follows a step's caption length.
 * `stage` is the element itself (held in state by a callback ref), so the observer is
 * attached whenever the element mounts. Falls back to the window width until measured.
 */
export function useFitScale(
  stage: HTMLElement | null,
  mode: Mode,
  designWidth: number = DESIGN_W,
  designHeight: number = DESIGN_H,
): number {
  const subscribe = useCallback(
    (notify: () => void) => {
      const observer = stage && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(notify) : null
      if (stage) observer?.observe(stage)
      window.addEventListener('resize', notify)
      return () => {
        observer?.disconnect()
        window.removeEventListener('resize', notify)
      }
    },
    [stage],
  )
  const size = useSyncExternalStore(
    subscribe,
    () => `${stage?.getBoundingClientRect().width || window.innerWidth}x${window.innerHeight}`,
    () => '0x0',
  )
  const [width, height] = size.split('x').map(Number)
  return fitScale({ width, height }, mode, designWidth, designHeight)
}
