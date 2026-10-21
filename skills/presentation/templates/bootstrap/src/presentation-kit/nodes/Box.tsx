import type { LucideIcon } from 'lucide-react'
import { Node } from './Node'
import type { NodeProps } from './Node'

export interface BoxProps extends NodeProps {
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <Node kind="box" {...rest}>
      {Icon ? <Icon data-presentation-icon aria-hidden /> : null}
      {children}
    </Node>
  )
}
