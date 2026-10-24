import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T } from '../constants.ts'
import { placementStyle, type NodeHooks } from './placement.ts'

export interface EntityProps extends NodeHooks {
  kind: 'box' | 'label' | 'frame' | 'emphasis' | 'symbol-chip'
  Icon?: LucideIcon
  children?: ReactNode
}

/** Shared shell of the generic primitives: a layout-morphing element with identity and style hooks. */
export function Entity({ kind, id, at, className, style, variant, Icon, children }: EntityProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      className={className}
      style={placementStyle(at, style)}
      data-presentation-node={kind}
      data-presentation-entity={id}
      data-presentation-variant={variant}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
