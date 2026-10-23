import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { dataProps, entityAttrs, morphProps, type NodeProps } from './props.ts'

interface LabelProps extends NodeProps {
  children?: ReactNode
}

/** Text label entity; positioned by the caller through `style`. */
export function Label({ id, className, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...morphProps(id)}
      className={className}
      style={{ position: 'absolute', ...style }}
      {...entityAttrs('label', id)}
      {...dataProps(rest)}
    >
      {children}
    </motion.span>
  )
}
