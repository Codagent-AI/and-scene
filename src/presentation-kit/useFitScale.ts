import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
export const computeFitScale = (width: number, height: number, designW = DESIGN_W, designH = DESIGN_H) => Math.max(MIN_SCALE, Math.min(width / designW, height / designH))
export function useFitScale(mode: 'browse' | 'present') {
 const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
 useEffect(() => { const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight }); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
 const geometry = STAGE_LAYOUT[mode]
 return computeFitScale(size.width, Math.max(1, size.height - geometry.top - geometry.bottom))
}
