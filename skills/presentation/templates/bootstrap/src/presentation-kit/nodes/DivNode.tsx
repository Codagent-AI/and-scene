import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { appearProps, exitProps, nodeHooks, placement } from './shared'
import type { NodeProps } from './types'

/** Common implementation of the div-based primitives: identity hooks, placement, morph, enter/exit. */
export function DivNode({
  kind,
  layoutId,
  at,
  appear,
  variant,
  style,
  ...rest
}: NodeProps & { kind: string }) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...nodeHooks(kind, layoutId, variant)}
      {...appearProps(appear)}
      {...exitProps}
      {...rest}
      style={{ ...placement(at), ...style }}
    />
  )
}
