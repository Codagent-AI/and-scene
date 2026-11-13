import { useViewport } from './useViewport'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export const fitScale = (width: number, height: number, designW = DESIGN_W, designH = DESIGN_H) => Math.max(MIN_SCALE, Math.min(width/designW,height/designH))
export function useFitScale(mode: Mode) {
 const size=useViewport()
 const g=STAGE_LAYOUT[mode]
 return fitScale(size.w-g.side*2,size.h-g.top-g.bottom)
}
