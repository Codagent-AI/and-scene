import { useSyncExternalStore } from 'react'
import { COMPACT_NARROW_STAGE_LAYOUT, COMPACT_STAGE_LAYOUT, DESIGN_H, DESIGN_W, MIN_SCALE, SHORT_VIEWPORT, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { Mode } from './types'
const subscribe = (fn: () => void) => { window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }
const snapshot = () => `${window.innerWidth},${window.innerHeight}`
export function fitGeometry(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const compact = height <= SHORT_VIEWPORT
  const layouts = compact ? (width <= 600 ? COMPACT_NARROW_STAGE_LAYOUT : COMPACT_STAGE_LAYOUT) : STAGE_LAYOUT
  const layout = layouts[mode]
  const inset = width >= WIDE_VIEWPORT ? layout.toc : 0
  const availableW = Math.max(0, width - inset)
  const availableH = Math.max(0, height - layout.header - layout.footer)
  return { compact, layout, scale: Math.max(MIN_SCALE, Math.min(1, availableW / designW, availableH / designH)), inset, height: availableH }
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const size = useSyncExternalStore(subscribe, snapshot, () => '1280,800')
  const [width, height] = size.split(',').map(Number)
  return { ...fitGeometry(width, height, mode, designW, designH), wide: width >= WIDE_VIEWPORT }
}
