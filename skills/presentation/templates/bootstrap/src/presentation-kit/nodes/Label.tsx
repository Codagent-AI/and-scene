import { motion } from 'motion/react'
import { entityProps } from './props.ts'
import type { NodeProps } from './props.ts'

export function Label({ id, at, style, children, ...rest }: NodeProps) {
  return (
    <motion.span
      {...rest}
      {...entityProps('label', id, at, style)}
    >
      {children}
    </motion.span>
  )
}
