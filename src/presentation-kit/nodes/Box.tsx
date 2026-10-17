import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants.ts'
import { placementStyle } from './props.ts'
import type { NodeProps } from './props.ts'

interface BoxProps extends NodeProps {
  /** Optional glyph, passed as a component. */
  Icon?: LucideIcon
  label?: string
}

export function Box({ id, at, style, Icon, label, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-node="box"
      data-presentation-id={id}
      style={placementStyle(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph aria-hidden="true" /> : null}
      {label ? <span data-presentation-box-label>{label}</span> : null}
      {children}
    </motion.div>
  )
}
