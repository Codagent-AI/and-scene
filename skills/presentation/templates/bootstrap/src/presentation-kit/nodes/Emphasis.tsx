import type { ComponentPropsWithoutRef } from 'react'

export interface EmphasisProps extends ComponentPropsWithoutRef<'span'> {
  active: boolean
}

export function Emphasis({ active, className, children, ...rest }: EmphasisProps) {
  return (
    <span
      data-presentation-emphasis=""
      data-active={active}
      className={className}
      {...rest}
    >
      {children}
    </span>
  )
}
