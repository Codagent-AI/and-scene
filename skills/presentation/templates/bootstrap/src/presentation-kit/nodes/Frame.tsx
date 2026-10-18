import type { ReactNode } from 'react'
import { Entity, type EntityProps } from './Entity'

export type FrameProps = Omit<EntityProps, 'kind' | 'label'> & {
  /** Label rendered inside the frame in its own element. */
  label?: ReactNode
}

/** A bounding region drawn around other entities. */
export function Frame({ label, children, ...rest }: FrameProps) {
  return (
    <Entity kind="frame" {...rest}>
      {label !== undefined && <span data-presentation-frame-label="">{label}</span>}
      {children}
    </Entity>
  )
}
