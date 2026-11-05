import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './usePresentationNav'
export function fitScale(width: number, height: number, mode: Mode) { const geometry = STAGE_LAYOUT[mode]; return Math.max(0.01, Math.min((width - geometry.horizontal) / DESIGN_W, (height - geometry.vertical) / DESIGN_H, 1)) }
export function useFitScale(mode: Mode) { const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight })); useEffect(() => { const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight }); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, []); return fitScale(size.width, size.height, mode) }
