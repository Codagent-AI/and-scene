import type { NodeProps } from './base.ts'
import { LayoutNode } from './LayoutNode.tsx'

/** A grouping region drawn around other entities. Its outline comes from presentation CSS. */
export function Frame(props: NodeProps) {
  return <LayoutNode kind="frame" passive {...props} />
}
