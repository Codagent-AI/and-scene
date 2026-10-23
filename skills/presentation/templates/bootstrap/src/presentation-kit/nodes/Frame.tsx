import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'
import { rectStyle } from '../geometry.ts'
import type { NodeProps } from './Box.tsx'

/** Region that groups or surrounds other entities; the presentation draws it. */
export function Frame({ rect, style, ...rest }: NodeProps) {
  return <motion.div data-presentation-frame="" layout transition={LAYOUT_TRANSITION} {...rest} style={{ ...rectStyle(rect), ...style }} />
}
