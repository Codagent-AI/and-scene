import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EntityNode } from './EntityNode.tsx'
import type { NodeProps } from './shared.ts'

export interface BoxProps extends NodeProps {
  /** Optional Lucide glyph rendered before the children. */
  Icon?: LucideIcon
  emphasis?: boolean
  children?: ReactNode
}

export function Box({ Icon, emphasis, children, ...rest }: BoxProps) {
  return (
    <EntityNode {...rest} kind="box" data-presentation-emphasis={emphasis ? 'true' : undefined}>
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </EntityNode>
  )
}
