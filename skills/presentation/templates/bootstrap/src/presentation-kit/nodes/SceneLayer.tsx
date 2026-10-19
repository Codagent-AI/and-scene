import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Absolutely positioned layer filling the canvas, so mounting one layer never reflows another. */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {children}
    </div>
  )
}
