import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { dataProps, entityAttrs, morphProps, type NodeProps } from './props.ts'

interface FrameProps extends NodeProps {
  children?: ReactNode
}

/** Grouping frame drawn around other entities; geometry comes from `style`. */
export function Frame({ id, className, style, children, ...rest }: FrameProps) {
  return (
    <motion.div
      {...morphProps(id)}
      className={className}
      style={{ position: 'absolute', pointerEvents: 'none', ...style }}
      {...entityAttrs('frame', id)}
      {...dataProps(rest)}
    >
      {children}
    </motion.div>
  )
}
