import { useSyncExternalStore } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitScale(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const g = STAGE_LAYOUT[mode]
  const toc = width >= 1100 ? g.toc : 0
  return Math.max(0, Math.min((width - g.horizontal * 2 - toc) / designW, (height - g.top - g.bottom) / designH, 1.5))
}
const subscribe = (listener: () => void) => {
  window.addEventListener('resize', listener)
  return () => window.removeEventListener('resize', listener)
}
const snapshot = () => `${window.innerWidth},${window.innerHeight}`
export function useViewport() { return useSyncExternalStore(subscribe, snapshot, () => '1280,800').split(',').map(Number) }
export function useFitScale(mode: Mode, width = DESIGN_W, height = DESIGN_H) {
  const [vw, vh] = useViewport()
  return fitScale(vw, vh, mode, width, height)
}
