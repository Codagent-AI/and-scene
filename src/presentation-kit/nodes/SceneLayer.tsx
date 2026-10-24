import type { HTMLAttributes } from 'react'

/** Absolutely positioned layer for one step's diagram, so mounting it never reflows another. */
export function SceneLayer({ style, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-presentation-layer="" {...rest} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, ...style }}>
      {children}
    </div>
  )
}
