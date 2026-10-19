import type { HTMLAttributes } from 'react'

export interface EmphasisProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean
}

/** Marks inline content as emphasised; the presentation decides how that looks. */
export function Emphasis({ active = true, children, ...rest }: EmphasisProps) {
  return (
    <span {...rest} data-presentation-node="emphasis" data-presentation-emphasis={active ? 'true' : 'false'}>
      {children}
    </span>
  )
}
