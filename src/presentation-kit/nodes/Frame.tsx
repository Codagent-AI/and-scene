import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export interface FrameProps extends Omit<EntityProps, 'kind' | 'inert' | 'decorative'> {
  /** Optional caption for the frame, exposed as a styling hook. */
  label?: ReactNode
}

/** An unfilled region that groups or encloses other entities. */
export function Frame({ label, children, ...rest }: FrameProps) {
  return (
    <Entity kind="frame" inert {...rest}>
      {label !== undefined && <span data-presentation-label="">{label}</span>}
      {children}
    </Entity>
  )
}
