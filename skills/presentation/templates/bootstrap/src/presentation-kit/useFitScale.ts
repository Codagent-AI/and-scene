import { useSyncExternalStore } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}
function snapshot() { return `${window.innerWidth},${window.innerHeight}` }
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const geometry = STAGE_LAYOUT[mode]
  const aside = mode === 'browse' && width >= 1200 ? 190 : 0
  return Math.max(0, Math.min(1, (width - geometry.side * 2 - aside * 2) / designW,
    (height - geometry.top - geometry.bottom) / designH))
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const [width, height] = useSyncExternalStore(subscribe, snapshot, () => '1280,800').split(',').map(Number)
  return { scale: fitScale(width, height, mode, designW, designH), wide: width >= 1200 }
}
