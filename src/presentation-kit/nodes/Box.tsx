import type { LucideIcon } from 'lucide-react'
import { DivNode } from './DivNode'
import type { NodeProps } from './types'

export type BoxProps = NodeProps & {
  /** Optional glyph rendered before the children (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <DivNode kind="box" {...rest}>
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </DivNode>
  )
}
