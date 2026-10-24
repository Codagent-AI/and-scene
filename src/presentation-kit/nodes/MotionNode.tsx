import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hooks, placement } from './nodeProps'
import type { NodeProps } from './nodeProps'

interface MotionNodeProps extends NodeProps {
  kind: string
  as?: 'div' | 'span'
}

/** Shared shape of the generic primitives: a motion element keyed by a stable `layoutId`. */
export function MotionNode({ kind, as = 'div', ...props }: MotionNodeProps) {
  const Tag = as === 'span' ? motion.span : motion.div
  return (
    <Tag
      layoutId={props.id}
      className={props.className}
      style={placement(props)}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks(kind, props)}
    >
      {props.children}
    </Tag>
  )
}
