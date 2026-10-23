import type { HTMLAttributes } from 'react'

export interface SceneLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** Stacking order among layers. */
  z?: number
}

/** Absolutely positioned layer covering the canvas; mounting one never reflows another. */
export function SceneLayer({ z = 0, style, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      {...rest}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: z, ...style }}
    />
  )
}
