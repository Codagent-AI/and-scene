import type { CSSProperties, ReactNode } from 'react'
import type { DataAttributes } from './shared'

export interface EmphasisProps extends DataAttributes {
  active?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Inline wrapper that marks its content as emphasised for presentation-owned styling. */
export function Emphasis({ active = true, className, style, children, ...data }: EmphasisProps) {
  return (
    <span
      className={className}
      style={style}
      data-presentation-node="emphasis"
      data-presentation-emphasis={active ? 'true' : undefined}
      {...data}
    >
      {children}
    </span>
  )
}
