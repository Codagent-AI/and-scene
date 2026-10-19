import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface BoxProps extends Omit<EntityProps, 'kind'> {
  /** Optional Lucide icon component; nothing is rendered when omitted. */
  Icon?: LucideIcon
  label?: ReactNode
}

export function Box({ Icon, label, children, ...rest }: BoxProps) {
  return (
    <Entity kind="box" {...rest}>
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {label !== undefined ? <span data-presentation-label="">{label}</span> : null}
      {children}
    </Entity>
  )
}
