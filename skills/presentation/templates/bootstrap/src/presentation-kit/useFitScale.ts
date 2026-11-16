import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitGeometry(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const layout = STAGE_LAYOUT[mode]
  const toc = mode === 'browse' && width >= 1100 ? layout.toc : 0
  const availableW = Math.max(0, width - layout.side * 2 - toc)
  const availableH = Math.max(0, height - layout.top - layout.bottom)
  const scale = Math.max(0, Math.min(availableW / designW, availableH / designH))
  return { scale, left: layout.side + toc, top: layout.top, width: availableW, height: availableH, wide: width >= 1100 }
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return fitGeometry(viewport.width, viewport.height, mode, designW, designH)
}
