import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Absolutely positions a step's diagram content within the design canvas so
 * mounting or unmounting one layer never reflows another.
 */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      data-presentation-node="scene-layer"
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {children}
    </div>
  )
}
