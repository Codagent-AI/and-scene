import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { atStyle, entityMotion, type At, type NativeProps, type NodeHooks } from './shared'

export interface LabelProps extends NodeHooks, NativeProps<HTMLSpanElement> {
  at?: At
  children?: ReactNode
}

export function Label({ id, at, className, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...rest}
      {...entityMotion}
      layoutId={id}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={atStyle(at, style)}
    >
      {children}
    </motion.span>
  )
}
