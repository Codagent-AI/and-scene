import type { HTMLAttributes } from 'react'

export interface EmphasisProps extends HTMLAttributes<HTMLSpanElement> {
  /** When false the wrapper is inert; the hook flips so CSS can style the change. */
  active?: boolean
}

export function Emphasis({ active = true, children, ...rest }: EmphasisProps) {
  return (
    <span
      data-presentation-node="emphasis"
      data-presentation-active={active ? 'true' : undefined}
      {...rest}
    >
      {children}
    </span>
  )
}
