import type { ReactNode } from 'react'
import { dataProps, type NodeProps } from './props.ts'

interface SceneLayerProps extends NodeProps {
  children?: ReactNode
}

/**
 * Absolutely positioned layer filling the canvas, so mounting one layer never reflows
 * another and intentional overlaps and stacking are preserved.
 */
export function SceneLayer({ className, style, children, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-layer=""
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', ...style }}
      {...dataProps(rest)}
    >
      {children}
    </div>
  )
}
