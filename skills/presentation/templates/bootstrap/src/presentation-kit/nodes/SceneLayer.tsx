import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Absolutely positions a step's diagram layer so mounting one never reflows another. */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      className={className}
      data-presentation-node="scene-layer"
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {children}
    </div>
  )
}
