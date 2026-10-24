import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { placement } from './place.ts'
import type { NodeProps } from './types.ts'

interface MotionNodeProps extends NodeProps {
  kind: string
  tag?: 'div' | 'span'
}

/** Shared body of the layoutId-carrying primitives; each exports a thin named wrapper. */
export function MotionNode({ kind, tag = 'div', id, at, className, style, variant, children }: MotionNodeProps) {
  const props = {
    layout: true,
    layoutId: id,
    transition: { duration: LAYOUT_T, ease: EASE },
    'data-presentation-node': kind,
    'data-presentation-id': id,
    'data-variant': variant,
    className,
    style: placement(at, style),
    children,
  }
  return tag === 'span' ? <motion.span {...props} /> : <motion.div {...props} />
}
