import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hooks, placement } from './nodeProps'
import type { NodeProps } from './nodeProps'

export function Label(props: NodeProps) {
  return (
    <motion.span
      layoutId={props.id}
      className={props.className}
      style={placement(props)}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks('label', props)}
    >
      {props.children}
    </motion.span>
  )
}
