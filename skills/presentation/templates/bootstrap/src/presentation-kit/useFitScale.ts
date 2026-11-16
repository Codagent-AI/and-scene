import { useSyncExternalStore } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { Mode } from './types'
const subscribe = (fn: () => void) => { window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }
const snapshot = () => `${window.innerWidth},${window.innerHeight}`
export function fitGeometry(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  const inset = width >= WIDE_VIEWPORT ? layout.toc : 0
  const availableW = Math.max(0, width - inset)
  const availableH = Math.max(0, height - layout.header - layout.footer)
  return { scale: Math.max(MIN_SCALE, Math.min(1, availableW / designW, availableH / designH)), inset, height: availableH }
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const size = useSyncExternalStore(subscribe, snapshot, () => '1280,800')
  const [width, height] = size.split(',').map(Number)
  return { ...fitGeometry(width, height, mode, designW, designH), wide: width >= WIDE_VIEWPORT }
}
