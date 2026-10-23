import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface BoxProps extends EntityProps {
  /** Optional Lucide glyph, passed as a component. */
  Icon?: LucideIcon
  iconSize?: number
}

export function Box({ Icon, iconSize, children, kind = 'box', ...rest }: BoxProps) {
  return (
    <Entity kind={kind} {...rest}>
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" size={iconSize} />}
      {children}
    </Entity>
  )
}
