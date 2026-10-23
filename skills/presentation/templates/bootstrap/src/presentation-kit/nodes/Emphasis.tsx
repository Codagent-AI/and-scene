import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { appearProps, exitProps, nodeHooks, placement } from './shared'
import type { NodeProps } from './types'

/** Decorative marker drawn over another entity to call attention to it. */
export function Emphasis({ layoutId, at, appear, variant, style, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      aria-hidden="true"
      {...nodeHooks('emphasis', layoutId, variant)}
      {...appearProps(appear)}
      {...exitProps}
      {...rest}
      style={{ ...placement(at), ...style }}
    />
  )
}
