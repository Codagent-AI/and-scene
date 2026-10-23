import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { dataProps, entityAttrs, type NodeProps } from './props.ts'

interface BoxProps extends NodeProps {
  /** Optional glyph, passed as a component (icon-as-component pattern). */
  Icon?: LucideIcon
  children?: ReactNode
}

/** Generic box entity. Carries `layoutId` so it morphs between steps. */
export function Box({ id, className, style, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={{ position: 'absolute', ...style }}
      {...entityAttrs('box', id)}
      {...dataProps(rest)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
