import type { NodeProps } from './base.ts'
import { LayoutNode } from './LayoutNode.tsx'

export function Label(props: NodeProps) {
  return <LayoutNode kind="label" {...props} />
}
