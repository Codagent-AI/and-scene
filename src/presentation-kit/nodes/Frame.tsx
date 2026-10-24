import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hooks, placement } from './nodeProps'
import type { NodeProps } from './nodeProps'

/** A region that groups or surrounds other entities; children are typically its label. */
export function Frame(props: NodeProps) {
  return (
    <motion.div
      layoutId={props.id}
      className={props.className}
      style={placement(props)}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks('frame', props)}
    >
      {props.children}
    </motion.div>
  )
}
