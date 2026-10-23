import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { dataProps, entityAttrs, type NodeProps } from './props.ts'

interface LabelProps extends NodeProps {
  children?: ReactNode
}

/** Text label entity; positioned by the caller through `style`. */
export function Label({ id, className, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={{ position: 'absolute', ...style }}
      {...entityAttrs('label', id)}
      {...dataProps(rest)}
    >
      {children}
    </motion.span>
  )
}
