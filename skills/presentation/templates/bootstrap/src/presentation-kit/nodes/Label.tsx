import type { ReactNode } from 'react'
import { Entity } from './Entity.tsx'
import type { NodeHooks } from './placement.ts'

export interface LabelProps extends NodeHooks {
  children?: ReactNode
}

export function Label(props: LabelProps) {
  return <Entity kind="label" {...props} />
}
