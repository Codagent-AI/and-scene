import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { appearProps, exitProps, nodeHooks, placement } from './shared'
import type { NodeProps } from './types'

/** A rectangle drawn around other entities; children (e.g. a label) are optional. */
export function Frame({ layoutId, at, appear, variant, style, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...nodeHooks('frame', layoutId, variant)}
      {...appearProps(appear)}
      {...exitProps}
      {...rest}
      style={{ ...placement(at), ...style }}
    />
  )
}
