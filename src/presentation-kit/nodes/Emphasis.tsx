import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hooks, placement } from './nodeProps'
import type { NodeProps } from './nodeProps'

/** An emphasis marker (ring, underline, flag) drawn over another entity's bounds. */
export function Emphasis(props: NodeProps) {
  return (
    <motion.div
      layoutId={props.id}
      className={props.className}
      style={placement(props)}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks('emphasis', props)}
    >
      {props.children}
    </motion.div>
  )
}
