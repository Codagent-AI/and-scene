import type { ReactNode } from 'react'
import { PositionedNode } from './PositionedNode.tsx'
import type { NodeProps } from './PositionedNode.tsx'

/** A region drawn around other entities; its subtree may overlap them. */
export function Frame({ label, children, ...rest }: NodeProps & { label?: ReactNode }) {
  return (
    <PositionedNode kind="frame" data-presentation-allow-overlap="" {...rest}>
      {label !== undefined && <span data-presentation-frame-label="">{label}</span>}
      {children}
    </PositionedNode>
  )
}
