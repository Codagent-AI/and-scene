import { motion } from 'motion/react'
import { place } from '../layout'
import { dataProps, entityProps, type NodeBase } from './shared'

/** Text placed on the canvas. Morphs by identity like every other entity. */
export function Label({ id, x, y, width, height, className, style, children, allowOverlap, ...rest }: NodeBase) {
  return (
    <motion.div
      {...dataProps(rest)}
      {...entityProps(id, allowOverlap)}
      data-presentation-node="label"
      className={className}
      style={{ ...place(x, y, width, height), ...style }}
    >
      {children}
    </motion.div>
  )
}
