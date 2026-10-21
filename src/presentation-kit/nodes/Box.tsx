import type { LucideIcon } from 'lucide-react'
import { Node, type NodeProps } from './Node'

export interface BoxProps extends NodeProps {
  /** Optional glyph rendered ahead of the children. */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <Node kind="box" {...rest}>
      {Icon ? <Icon aria-hidden="true" data-presentation-icon="" /> : null}
      {children}
    </Node>
  )
}
