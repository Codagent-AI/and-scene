import type { ComponentProps, ReactNode } from 'react'

export interface EmphasisProps extends Omit<ComponentProps<'span'>, 'id'> {
  /** Stable identity hook (`data-presentation-id`). */
  id?: string
  /** Emphasis state exposed as `data-presentation-emphasis`; falsy renders `off`. */
  active?: boolean | string
  children?: ReactNode
}

/** Marks content as emphasised via hooks only; the presentation CSS decides how that looks. */
export function Emphasis({ id, active = true, children, ...rest }: EmphasisProps) {
  return (
    <span
      {...rest}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      data-presentation-emphasis={active ? (active === true ? 'on' : active) : 'off'}
    >
      {children}
    </span>
  )
}
