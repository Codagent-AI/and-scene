import { useSyncExternalStore, type RefObject } from 'react'
import { fitScale } from './fit'
import { DESIGN_H, DESIGN_W } from './constants'
import type { Mode } from './types'

/**
 * Tracks the element's size and returns the uniform fit scale for `mode`.
 * Re-measures on element resize (ResizeObserver) and window resize.
 */
export function useFitScale(
  ref: RefObject<HTMLElement | null>,
  mode: Mode,
  designWidth: number = DESIGN_W,
  designHeight: number = DESIGN_H,
): number {
  const measured = useSyncExternalStore(
    (notify) => {
      const el = ref.current
      const observer = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(notify) : null
      if (el) observer?.observe(el)
      window.addEventListener('resize', notify)
      return () => {
        observer?.disconnect()
        window.removeEventListener('resize', notify)
      }
    },
    () => {
      const rect = ref.current?.getBoundingClientRect()
      return rect ? `${rect.width}x${rect.height}` : '0x0'
    },
    () => '0x0',
  )
  const [width, height] = measured.split('x').map(Number)
  return fitScale({ width, height }, mode, designWidth, designHeight)
}
