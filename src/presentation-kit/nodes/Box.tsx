import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export type BoxProps = Omit<EntityProps, 'kind'> & {
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <Entity kind="box" {...rest}>
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </Entity>
  )
}
