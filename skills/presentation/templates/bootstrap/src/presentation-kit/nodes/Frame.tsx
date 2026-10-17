import { motion } from 'motion/react'
import { entityProps } from './props.ts'
import type { NodeProps } from './props.ts'

/** A rectangle around part of, or all of, the diagram. Styling comes from the presentation. */
export function Frame({ id, at, style, children, ...rest }: NodeProps) {
  return (
    <motion.div
      {...rest}
      {...entityProps('frame', id, at, style)}
    >
      {children}
    </motion.div>
  )
}
