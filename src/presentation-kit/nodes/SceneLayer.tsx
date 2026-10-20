import type { HTMLAttributes } from 'react'

/** Absolutely positioned layer so mounting one never reflows another. */
export function SceneLayer({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-scene-layer=""
      {...rest}
      style={{ ...style, position: 'absolute', inset: 0 }}
    />
  )
}
