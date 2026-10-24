import type { CSSProperties, ReactNode } from 'react'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Absolutely positioned layer so mounting one never reflows another. */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      data-presentation-layer=""
    >
      {children}
    </div>
  )
}
