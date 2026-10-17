import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export type NodeKind = 'box' | 'label' | 'frame' | 'emphasis' | 'symbol-chip'

export type NodeProps = Geometry &
  Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> & {
    children?: ReactNode
    /** Stable entity identity; also the shared `layoutId` that makes it morph. */
    id: string
    /** Optional glyph rendered before the children. */
    icon?: LucideIcon
  }

/** Shared body of the generic primitives; adds identity and hooks, never visuals. */
export function EntityNode({
  kind,
  id,
  x,
  y,
  w,
  h,
  icon: Icon,
  style,
  children,
  ...rest
}: NodeProps & { kind: NodeKind }) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      data-presentation-entity={id}
      data-presentation-node={kind}
      {...rest}
      style={{ ...geometryStyle({ x, y, w, h }), ...style }}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
