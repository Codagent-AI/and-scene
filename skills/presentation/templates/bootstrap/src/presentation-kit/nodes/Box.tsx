import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Entity } from './Entity.tsx'
import type { NodeHooks } from './placement.ts'

export interface BoxProps extends NodeHooks {
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box(props: BoxProps) {
  return <Entity kind="box" {...props} />
}
