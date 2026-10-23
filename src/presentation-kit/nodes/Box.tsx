import type { LucideIcon } from 'lucide-react'
import { Entity, type EntityProps } from './Entity'

export interface BoxProps extends EntityProps {
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...props }: BoxProps) {
  return (
    <Entity kind="box" {...props}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </Entity>
  )
}
