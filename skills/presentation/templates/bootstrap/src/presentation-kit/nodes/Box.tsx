import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { useEnterMotion } from './useEnterMotion'
import { EXIT, entityAttributes, rectStyle } from './shared'
import type { DataAttributes, NodeProps } from './shared'

export interface BoxProps extends NodeProps, DataAttributes {
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ id, className, style, at, emphasis, appear, Icon, children, ...data }: BoxProps) {
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
      {...entityAttributes(id, 'box', emphasis)}
      {...data}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
