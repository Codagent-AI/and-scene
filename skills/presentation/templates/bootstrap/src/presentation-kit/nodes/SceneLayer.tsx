import type { ComponentPropsWithoutRef } from 'react'

export type SceneLayerProps = ComponentPropsWithoutRef<'div'>

/**
 * Absolutely positions a step's diagram within the stage so mounting one
 * layer never reflows another. Layout geometry only, no visual styling.
 */
export function SceneLayer({ className, style, children, ...rest }: SceneLayerProps) {
  return (
    <div
      data-presentation-scene-layer=""
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}
