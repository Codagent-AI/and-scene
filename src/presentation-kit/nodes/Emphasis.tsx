import type { HTMLAttributes } from 'react'

export interface EmphasisProps extends HTMLAttributes<HTMLSpanElement> {
  /** Whether the emphasis state is on; exposed as data-presentation-emphasized for styling. */
  active?: boolean
}

export function Emphasis({ active = true, ...rest }: EmphasisProps) {
  return (
    <span
      data-presentation-node="emphasis"
      data-presentation-emphasized={active ? 'true' : 'false'}
      {...rest}
    />
  )
}
