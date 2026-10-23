import type { LucideIcon } from 'lucide-react'
import { NodeBase, type NodeProps } from './NodeBase'

export interface BoxProps extends NodeProps {
  Icon?: LucideIcon
}

/** Generic bordered card. The kit supplies no card treatment. */
export function Box({ Icon, children, ...props }: BoxProps) {
  return (
    <NodeBase data-presentation-box="" {...props}>
      {Icon ? <Icon aria-hidden="true" data-presentation-icon="" /> : null}
      {children}
    </NodeBase>
  )
}
