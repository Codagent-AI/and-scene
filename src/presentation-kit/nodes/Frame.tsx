import { motion } from 'motion/react'
import { place } from '../layout'
import { dataProps, entityProps, type NodeBase } from './shared'

/** Outline region that groups or encloses other nodes. Its children are not clipped. */
export function Frame({ id, x, y, width, height, className, style, children, allowOverlap, ...rest }: NodeBase) {
  return (
    <motion.div
      {...dataProps(rest)}
      {...entityProps(id, allowOverlap)}
      data-presentation-node="frame"
      className={className}
      style={{ ...place(x, y, width, height), ...style }}
    >
      {children}
    </motion.div>
  )
}
