import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/** Absolutely positions a step's diagram so mounting one layer never reflows another. */
export function SceneLayer({ children, className, style }: SceneLayerProps) {
  return (
    <div data-presentation-scene-layer="" className={className} style={{ position: 'absolute', inset: 0, ...style }}>
      {children}
    </div>
  )
}
