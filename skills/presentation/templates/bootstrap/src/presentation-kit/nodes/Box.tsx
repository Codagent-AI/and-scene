import type { LucideIcon } from 'lucide-react'
import { MotionNode } from './MotionNode'
import type { NodeProps } from './nodeProps'

interface BoxProps extends NodeProps {
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...props }: BoxProps) {
  return (
    <MotionNode kind="box" {...props}>
      {Icon && <Icon aria-hidden data-presentation-icon />}
      {children}
    </MotionNode>
  )
}
