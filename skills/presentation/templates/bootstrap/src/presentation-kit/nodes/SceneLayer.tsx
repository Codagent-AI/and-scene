import type { HTMLAttributes } from 'react'

export interface SceneLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional name for the layer, exposed as a hook. */
  name?: string
}

/** Absolutely positioned layer so mounting one step's diagram never reflows another. */
export function SceneLayer({ name, children, style, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-layer={name ?? ''}
      style={{ position: 'absolute', inset: 0, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}
