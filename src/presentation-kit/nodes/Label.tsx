import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { appearProps, exitProps, nodeHooks, placement } from './shared'
import type { NodeProps } from './types'

export function Label({ layoutId, at, appear, variant, style, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...nodeHooks('label', layoutId, variant)}
      {...appearProps(appear)}
      {...exitProps}
      {...rest}
      style={{ ...placement(at), ...style }}
    />
  )
}
