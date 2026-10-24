import type { CSSProperties, ReactNode } from 'react'
import { DESIGN_H, DESIGN_W } from '../constants.ts'

interface SceneLayerProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/** Absolutely positions a step's diagram so mounting one layer never reflows another. */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div
      data-presentation-layer=""
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, height: DESIGN_H, ...style }}
    >
      {children}
    </div>
  )
}
