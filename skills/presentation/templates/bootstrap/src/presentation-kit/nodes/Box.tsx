import type { LucideIcon } from 'lucide-react'
import { EntityNode, type NodeProps } from './EntityNode'

/** Container entity with an optional Lucide glyph. */
export function Box({ icon, ...props }: NodeProps & { icon?: LucideIcon }) {
  return <EntityNode kind="box" icon={icon} {...props} />
}
