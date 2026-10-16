import type { CSSProperties, HTMLAttributes } from 'react'

/** Absolutely positioned layer so mounting one step's diagram never reflows another. */
export function SceneLayer({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const base: CSSProperties = { position: 'absolute', inset: 0 }
  return <div data-presentation-layer="" style={{ ...base, ...style }} {...rest} />
}
