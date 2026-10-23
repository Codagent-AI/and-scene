import type { LucideIcon } from 'lucide-react'
import { BaseNode, type BaseNodeProps } from './BaseNode.tsx'

export interface BoxProps extends BaseNodeProps {
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
}

export function Box({ Icon, children, ...rest }: BoxProps) {
  return (
    <BaseNode as="div" kind="box" {...rest}>
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </BaseNode>
  )
}
