import { useSyncExternalStore } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { PresentationMode } from './types'

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}
function viewport() { return `${window.innerWidth},${window.innerHeight}` }

export function computeFitScale(width: number, height: number, mode: PresentationMode) {
  const layout = STAGE_LAYOUT[mode]
  const wide = width >= WIDE_VIEWPORT
  const left = layout.gutter + (wide ? layout.tocWidth : 0)
  const right = layout.gutter
  const available = Math.max(0, Math.min((width - left - right) / DESIGN_W, (height - layout.top - layout.bottom) / DESIGN_H))
  // The minimum is a preferred floor, never permission to overflow the viewport.
  const scale = Math.min(available, Math.max(MIN_SCALE, Math.min(1, available)))
  return { scale, left, right, top: layout.top, bottom: layout.bottom, wide }
}

export function useFitScale(mode: PresentationMode) {
  const dimensions = useSyncExternalStore(subscribe, viewport, () => '880,720')
  const [width, height] = dimensions.split(',').map(Number)
  return computeFitScale(width, height, mode)
}
