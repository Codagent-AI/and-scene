import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

export type LayoutNodeProps = NodeProps & {
  kind: string
  Icon?: LucideIcon
  /** Decorative nodes (frames, emphasis markers) never take pointer events. */
  passive?: boolean
}

/** Shared body of the layout primitives: stable identity (layoutId) so the entity morphs across steps. */
export function LayoutNode({ kind, id, at, style, allowOverlap, Icon, passive, children, ...rest }: LayoutNodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...nodeAttrs(kind, id, allowOverlap)}
      {...rest}
      style={passive ? { pointerEvents: 'none', ...placement(at, style) } : placement(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
