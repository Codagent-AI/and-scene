import { useEffect, useState } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { Mode } from './types'
export function fitGeometry(width: number, height: number, mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const g = STAGE_LAYOUT[mode]
  const toc = mode === 'browse' && width >= 1100 ? STAGE_LAYOUT.browse.toc : 0
  const availableW = Math.max(0, width - g.side * 2 - toc)
  const availableH = Math.max(0, height - g.top - g.bottom)
  return { scale: Math.min(availableW / designW, availableH / designH, 1), top: g.top, bottom: g.bottom, left: g.side + toc, right: g.side }
}
export function useFitScale(mode: Mode, designW = DESIGN_W, designH = DESIGN_H) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return { ...fitGeometry(viewport.width, viewport.height, mode, designW, designH), wide: viewport.width >= 1100 }
}
