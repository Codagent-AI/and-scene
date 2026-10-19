import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export interface FrameProps extends Omit<EntityProps, 'kind'> {
  label?: ReactNode
}

/** A rectangle drawn around other entities. */
export function Frame({ label, children, ...rest }: FrameProps) {
  return (
    <Entity kind="frame" {...rest}>
      {label !== undefined ? <span data-presentation-label="">{label}</span> : null}
      {children}
    </Entity>
  )
}
