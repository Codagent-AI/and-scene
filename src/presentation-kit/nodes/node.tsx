import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EXIT_TRANSITION, LAYOUT_TRANSITION, geometry } from './motion'

/** Props every scene primitive accepts: stable identity, optional geometry, and style hooks. */
export interface NodeProps {
  /** Stable entity identity; doubles as the Motion `layoutId`. */
  id: string
  /** Canvas coordinates. When `x` or `y` is given the node is absolutely positioned. */
  x?: number
  y?: number
  width?: number
  height?: number
  className?: string
  /** Author-owned style; wins over kit geometry. */
  style?: CSSProperties
  children?: ReactNode
  /** Extra `data-*` hooks for presentation CSS, e.g. `{ 'data-variant': 'ghost' }`. */
  hooks?: Record<`data-${string}`, string | undefined>
}

/** Shared shell: a Motion element whose `layoutId` makes persisting entities morph in place. */
export function NodeShell({
  kind,
  props,
  children,
}: {
  kind: string
  props: NodeProps
  children?: ReactNode
}) {
  const { id, className, style, hooks } = props
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: LAYOUT_TRANSITION }}
      exit={{ opacity: 0, transition: EXIT_TRANSITION }}
      className={className}
      style={{ ...geometry(props), ...style }}
      data-presentation-node={kind}
      data-presentation-entity={id}
      {...hooks}
    >
      {children}
    </motion.div>
  )
}
