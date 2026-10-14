import type { HTMLAttributes } from 'react'

/** Absolutely positioned, canvas-filling layer so mounting one never reflows another. */
export function SceneLayer({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-node="scene-layer"
      style={{ position: 'absolute', inset: 0, ...style }}
      {...rest}
    />
  )
}
