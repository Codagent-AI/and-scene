import { motion } from 'motion/react'
import { place } from '../layout'
import { entityProps, type NodeBase } from './shared'

/** Highlight ring drawn over another node's area. Pointer-transparent. */
export function Emphasis({ id, x, y, width, height, className, style, allowOverlap }: NodeBase) {
  return (
    <motion.div
      {...entityProps(id, allowOverlap)}
      data-presentation-node="emphasis"
      className={className}
      style={{ ...place(x, y, width, height), pointerEvents: 'none', ...style }}
    />
  )
}
