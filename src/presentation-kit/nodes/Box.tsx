import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { entityProps } from './props.ts'
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
      {...entityProps('box', id, at, style)}
    >
      {Icon ? <Icon data-presentation-glyph aria-hidden="true" /> : null}
      {label ? <span data-presentation-box-label>{label}</span> : null}
      {children}
    </motion.div>
  )
}
