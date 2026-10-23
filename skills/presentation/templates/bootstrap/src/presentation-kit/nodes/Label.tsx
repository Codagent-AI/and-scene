import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'
import { rectStyle } from '../geometry.ts'
import type { NodeProps } from './Box.tsx'

/** Text entity. */
export function Label({ rect, style, ...rest }: NodeProps) {
  return <motion.div data-presentation-label="" layout transition={LAYOUT_TRANSITION} {...rest} style={{ ...rectStyle(rect), ...style }} />
}
