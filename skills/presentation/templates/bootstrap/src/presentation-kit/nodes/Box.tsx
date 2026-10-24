import type { LucideIcon } from 'lucide-react'
import { PositionedNode } from './PositionedNode.tsx'
import type { NodeProps } from './PositionedNode.tsx'

export type BoxProps = NodeProps & {
  /** Optional glyph, passed as a component: `icon={Server}`. */
  icon?: LucideIcon
}

export function Box({ icon: Icon, children, ...rest }: BoxProps) {
  return (
    <PositionedNode kind="box" {...rest}>
      {Icon && <Icon data-presentation-icon aria-hidden="true" />}
      {children}
    </PositionedNode>
  )
}
