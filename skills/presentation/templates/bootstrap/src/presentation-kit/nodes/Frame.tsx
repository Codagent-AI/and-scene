import { motion } from 'motion/react'
import { rectStyle } from '../geometry.ts'
import type { NodeProps } from './Box.tsx'

/** Region that groups or surrounds other entities; the presentation draws it. */
export function Frame({ rect, style, ...rest }: NodeProps) {
  return <motion.div data-presentation-frame="" layout {...rest} style={{ ...rectStyle(rect), ...style }} />
}
