import type { ReactNode } from 'react'
import { EntityNode } from './EntityNode.tsx'
import type { NodeProps } from './shared.ts'

export interface FrameProps extends NodeProps {
  /** Optional caption for the frame. */
  label?: ReactNode
  children?: ReactNode
}

/** An outline region around other entities; it draws nothing by itself. */
export function Frame({ label, children, ...rest }: FrameProps) {
  return (
    <EntityNode {...rest} kind="frame">
      {label ? <span data-presentation-frame-label="">{label}</span> : null}
      {children}
    </EntityNode>
  )
}
