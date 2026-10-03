import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface BoxProps extends EntityProps {
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <Entity kind="box" {...rest}>
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </Entity>
  )
}
