import { motion } from 'motion/react'
import { rectStyle } from '../geometry.ts'
import type { NodeProps } from './Box.tsx'

/** Text entity. */
export function Label({ rect, style, ...rest }: NodeProps) {
  return <motion.div data-presentation-label="" layout {...rest} style={{ ...rectStyle(rect), ...style }} />
}
