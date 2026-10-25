import type { LucideIcon } from 'lucide-react'
import type { NodeProps } from './base.ts'
import { LayoutNode } from './LayoutNode.tsx'

export type BoxProps = NodeProps & { Icon?: LucideIcon }

/** A box that keeps its identity (layoutId) across steps. */
export function Box(props: BoxProps) {
  return <LayoutNode kind="box" {...props} />
}
