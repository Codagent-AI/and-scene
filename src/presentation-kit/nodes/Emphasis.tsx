import type { ReactNode } from 'react'
import type { DataAttributes } from './shared'

export interface EmphasisProps extends DataAttributes {
  active?: boolean
  className?: string
  children?: ReactNode
}

/** Inline wrapper that marks its content as emphasised for presentation-owned styling. */
export function Emphasis({ active = true, className, children, ...data }: EmphasisProps) {
  return (
    <span
      className={className}
      data-presentation-node="emphasis"
      data-presentation-emphasis={active ? 'true' : undefined}
      {...data}
    >
      {children}
    </span>
  )
}
