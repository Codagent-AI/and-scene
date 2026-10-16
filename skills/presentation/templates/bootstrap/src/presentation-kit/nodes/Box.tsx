import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface BoxProps extends EntityProps {
  Icon?: LucideIcon
}

/** Generic card-like node. Carries layoutId; supplies no visual style. */
export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <Entity kind="box" {...rest}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </Entity>
  )
}
