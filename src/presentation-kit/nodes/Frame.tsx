import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { useEnterMotion } from './useEnterMotion'
import { EXIT, entityAttributes, rectStyle } from './shared'
import type { DataAttributes, NodeProps } from './shared'

export interface FrameProps extends NodeProps, DataAttributes {
  children?: ReactNode
}

/** Outline region that groups or encloses other entities. It never captures pointer events. */
export function Frame({ id, className, style, at, emphasis, appear, children, ...data }: FrameProps) {
  const enter = useEnterMotion(appear)
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={EXIT}
      {...enter}
      className={className}
      style={rectStyle(at, { pointerEvents: 'none', ...style })}
      {...entityAttributes(id, 'frame', emphasis)}
      {...data}
    >
      {children}
    </motion.div>
  )
}
