import type { LucideIcon } from 'lucide-react'
import { MotionNode } from './MotionNode.tsx'
import type { NodeProps } from './types.ts'

interface BoxProps extends NodeProps {
  Icon?: LucideIcon
}

/** Generic card; carries a layoutId so it morphs between steps. */
export function Box({ Icon, children, ...props }: BoxProps) {
  return (
    <MotionNode kind="box" {...props}>
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </MotionNode>
  )
}
