import type { CSSProperties, ReactNode } from 'react'

/** Absolutely positions a diagram layer so mounting one never reflows another. */
export function SceneLayer({
  name,
  children,
  className,
  style,
}: {
  name?: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      data-presentation-layer={name}
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {children}
    </div>
  )
}
