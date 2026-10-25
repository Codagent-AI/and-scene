import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants'
import type { Mode } from './types'

export function fitGeometry(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  const left = layout.side + (width >= WIDE_VIEWPORT ? layout.toc : 0)
  const availableW = Math.max(0, width - left - layout.side)
  const availableH = Math.max(0, height - layout.top - layout.bottom)
  return { left, top: layout.top, width: availableW, height: availableH,
    scale: Math.max(0, Math.min(availableW / designW, availableH / designH)) }
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitGeometry(size.width, size.height, mode, designW, designH)
}
