import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hooks, placement } from './nodeProps'
import type { NodeProps } from './nodeProps'

/** Small generic chip for a symbol, glyph, or short token. */
export function SymbolChip(props: NodeProps) {
  return (
    <motion.span
      layoutId={props.id}
      className={props.className}
      style={placement(props)}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks('symbol-chip', props)}
    >
      {props.children}
    </motion.span>
  )
}
