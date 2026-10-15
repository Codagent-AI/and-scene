import type { HTMLAttributes } from 'react'
import { Presence } from './Presence'

export interface SceneLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional name for the layer, exposed as a hook. */
  name?: string
}

/**
 * Absolutely positioned layer so mounting one step's diagram never reflows another. Its direct
 * children animate out when they are removed (see `Presence`).
 */
export function SceneLayer({ name, children, style, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-layer={name ?? ''}
      style={{ position: 'absolute', inset: 0, ...style }}
      {...rest}
    >
      <Presence>{children}</Presence>
    </div>
  )
}
