import type { CSSProperties } from 'react'

/** Centers the fixed design canvas before scaling so narrow viewports keep its edges visible. */
export function getCanvasPlacementStyle(scale: number): CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) scale(${scale})`,
    transformOrigin: 'center',
  }
}
