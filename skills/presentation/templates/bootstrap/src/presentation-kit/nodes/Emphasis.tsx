import { motion } from 'motion/react'
import { rectStyle } from '../geometry.ts'
import type { NodeProps } from './Box.tsx'

/** Emphasis marker (halo, flag, highlight) positioned over an entity. */
export function Emphasis({ rect, style, ...rest }: NodeProps) {
  return <motion.div data-presentation-emphasis="" layout {...rest} style={{ ...rectStyle(rect), ...style }} />
}
