import type { ReactNode } from 'react'
import { Node } from './Node'
import type { NodeProps } from './Node'

export interface FrameProps extends NodeProps {
  label?: ReactNode
}

/** A container drawn around other entities, with an optional label. */
export function Frame({ label, children, style, ...rest }: FrameProps) {
  return (
    <Node kind="frame" style={{ pointerEvents: 'none', ...style }} {...rest}>
      {label ? <span data-presentation-frame-label>{label}</span> : null}
      {children}
    </Node>
  )
}
