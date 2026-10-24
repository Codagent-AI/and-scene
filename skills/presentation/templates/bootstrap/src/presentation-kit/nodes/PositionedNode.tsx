import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants.ts'

export interface NodeBox {
  /** Stable entity identity: becomes the layoutId, so it morphs across steps. */
  id: string
  /** Position and size in design-canvas pixels. */
  x: number
  y: number
  width?: number
  height?: number
}

export type NodeProps = NodeBox &
  Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'layout' | 'children'> & {
    children?: ReactNode
  }

export type NodeKind = 'box' | 'label' | 'frame' | 'emphasis' | 'symbol-chip'

/** Shared base: an absolutely positioned motion node with stable style hooks. */
export function PositionedNode({
  kind,
  id,
  x,
  y,
  width,
  height,
  style,
  children,
  ...rest
}: NodeProps & { kind: NodeKind }) {
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node={kind}
      data-presentation-id={id}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...rest}
      style={{ position: 'absolute', left: x, top: y, width, height, ...style }}
    >
      {children}
    </motion.div>
  )
}
