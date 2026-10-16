import type { HTMLAttributes } from 'react'

/** Absolutely positioned layer filling the canvas, so mounting one never reflows another. */
export function SceneLayer({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-presentation-scene-layer=""
      style={{ position: 'absolute', inset: 0, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}
