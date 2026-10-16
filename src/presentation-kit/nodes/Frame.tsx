import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'
import type { Rect } from './geometry'

export interface FrameProps extends EntityProps {
  at: Rect
  /** Optional caption label for the frame. */
  label?: ReactNode
}

/** Outline region around other entities; draws nothing until styled. */
export function Frame({ label, children, ...rest }: FrameProps) {
  return (
    <Entity kind="frame" {...rest}>
      {label !== undefined && <span data-presentation-frame-label="">{label}</span>}
      {children}
    </Entity>
  )
}
