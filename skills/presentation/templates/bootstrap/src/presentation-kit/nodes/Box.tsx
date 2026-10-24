import type { LucideIcon } from 'lucide-react'
import { Node, type NodeProps } from './Node'

export interface BoxProps extends NodeProps {
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <Node kind="box" {...rest}>
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </Node>
  )
}
