import { motion } from 'motion/react'
import { entityProps } from './props.ts'
import type { NodeProps } from './props.ts'

/** An emphasis marker placed over another entity (ring, highlight, flag). */
export function Emphasis({ id, at, style, children, ...rest }: NodeProps) {
  return (
    <motion.div
      {...rest}
      {...entityProps('emphasis', id, at, style)}
    >
      {children}
    </motion.div>
  )
}
