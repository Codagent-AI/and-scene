import type { CSSProperties, ReactNode } from 'react'
import { Appear } from './Appear.tsx'

export interface EmphasisProps {
  id: string
  /** Whether the emphasis marker is currently shown. */
  active?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Emphasis marker over an area of the canvas that fades in and out. */
export function Emphasis({ id, active = true, className, style, children }: EmphasisProps) {
  return (
    <Appear
      when={active}
      id={id}
      className={className}
      style={{ position: 'absolute', pointerEvents: 'none', ...style }}
    >
      <span data-presentation-node="emphasis" data-presentation-id={id} />
      {children}
    </Appear>
  )
}
