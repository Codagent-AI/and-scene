import type { HTMLAttributes } from 'react'

/** Absolutely positioned layer covering the canvas so one step never reflows another. */
export function SceneLayer({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-scene-layer=""
      {...rest}
      style={{ position: 'absolute', inset: 0, ...style }}
    />
  )
}
