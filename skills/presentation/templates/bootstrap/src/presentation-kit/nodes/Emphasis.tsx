import type { ReactNode } from 'react'
import { Entity } from './Entity.tsx'
import type { NodeHooks } from './placement.ts'

export interface EmphasisProps extends NodeHooks {
  children?: ReactNode
}

/** A marker drawn over or around another entity (ring, flag, highlight). */
export function Emphasis({ style, ...props }: EmphasisProps) {
  return <Entity kind="emphasis" style={{ pointerEvents: 'none', ...style }} {...props} />
}
