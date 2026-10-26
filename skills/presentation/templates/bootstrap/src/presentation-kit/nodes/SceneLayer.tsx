import type { CSSProperties, ReactNode } from 'react'
import { classNames } from './classNames'

export interface SceneLayerProps {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Absolutely positions a step's diagram content within the fixed design
 * canvas so mounting one layer never reflows another. Positioning is layout
 * plumbing, not a visual default.
 */
export function SceneLayer({ className, style, children }: SceneLayerProps) {
  return (
    <div
      className={classNames('sk-scene-layer', className)}
      style={{ position: 'absolute', inset: 0, ...style }}
      data-scene-kit="scene-layer"
    >
      {children}
    </div>
  )
}
