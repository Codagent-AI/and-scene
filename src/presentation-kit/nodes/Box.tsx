import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { place } from '../layout'
import { dataProps, entityProps, type NodeBase } from './shared'

export interface BoxProps extends NodeBase {
  /** Optional glyph rendered as a component (icon-as-component pattern). */
  icon?: LucideIcon
}

/** Generic bordered card. Carries its identity to Motion so it morphs between steps. */
export function Box({ id, x, y, width, height, icon: Icon, className, style, children, allowOverlap, ...rest }: BoxProps) {
  return (
    <motion.div
      {...dataProps(rest)}
      {...entityProps(id, allowOverlap)}
      data-presentation-node="box"
      className={className}
      style={{ ...place(x, y, width, height), ...style }}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph="" /> : null}
      {children}
    </motion.div>
  )
}
