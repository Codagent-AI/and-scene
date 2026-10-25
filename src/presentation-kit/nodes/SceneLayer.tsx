import type { HTMLAttributes } from 'react'

/** Absolutely positions a step's diagram so mounting one layer never reflows another. */
export function SceneLayer({ children, style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-presentation-layer="" {...rest} style={{ position: 'absolute', inset: 0, ...style }}>
      {children}
    </div>
  )
}
