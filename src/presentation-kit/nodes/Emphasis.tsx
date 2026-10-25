import type { NodeProps } from './base.ts'
import { LayoutNode } from './LayoutNode.tsx'

/** An emphasis marker (ring, flag, highlight). Looks come from presentation CSS. */
export function Emphasis(props: NodeProps) {
  return <LayoutNode kind="emphasis" passive {...props} />
}
