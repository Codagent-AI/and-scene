import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export interface BoxProps extends Omit<EntityProps, 'kind' | 'inert' | 'decorative'> {
  Icon?: LucideIcon
  label?: ReactNode
}

export function Box({ Icon, label, children, ...rest }: BoxProps) {
  return (
    <Entity kind="box" {...rest}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {label !== undefined && <span data-presentation-label="">{label}</span>}
      {children}
    </Entity>
  )
}
