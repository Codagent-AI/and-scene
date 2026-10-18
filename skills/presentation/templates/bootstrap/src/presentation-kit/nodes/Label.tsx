import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { useEnterMotion } from './useEnterMotion'
import { EXIT, entityAttributes, rectStyle } from './shared'
import type { DataAttributes, NodeProps } from './shared'

export interface LabelProps extends NodeProps, DataAttributes {
  children?: ReactNode
}

export function Label({ id, className, style, at, emphasis, appear, children, ...data }: LabelProps) {
  const enter = useEnterMotion(appear)
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={EXIT}
      {...enter}
      className={className}
      style={rectStyle(at, style)}
      {...entityAttributes(id, 'label', emphasis)}
      {...data}
    >
      {children}
    </motion.div>
  )
}
