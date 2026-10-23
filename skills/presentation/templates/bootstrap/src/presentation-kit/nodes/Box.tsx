import type { LucideIcon } from 'lucide-react'
import { Node, type NodeProps } from './Node'

export interface BoxProps extends NodeProps {
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...props }: BoxProps) {
  return (
    <Node kind="box" {...props}>
      {Icon && <Icon data-presentation-icon aria-hidden="true" />}
      {children}
    </Node>
  )
}
