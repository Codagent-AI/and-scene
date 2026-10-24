import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { placementStyle, type Placement } from './geometry'
import { EASE, ENTER_T, LAYOUT_T } from '../constants'

export type NodeKind = 'box' | 'label' | 'frame' | 'emphasis' | 'chip'

/** Stable hooks authors can attach, e.g. `data-presentation-allow-overlap`. */
export type DataProps = { [K in `data-${string}`]?: string | number | boolean }

export interface NodeProps extends Placement, DataProps {
  /** Stable entity id; doubles as the shared `layoutId` that makes the entity morph. */
  id: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Shared base for the node primitives: stable identity, style hooks, no visual defaults. */
export function Node({ kind, id, x, y, w, h, className, style, children, ...hooks }: NodeProps & { kind: NodeKind }) {
  return (
    <motion.div
      {...hooks}
      layoutId={id}
      data-presentation-node={kind}
      data-presentation-entity={id}
      className={className}
      style={{ ...placementStyle({ x, y, w, h }), ...style }}
      exit={{ opacity: 0 }}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T } }}
    >
      {children}
    </motion.div>
  )
}
