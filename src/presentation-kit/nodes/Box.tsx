import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, placementStyle, type NodeBaseProps } from './shared.ts'

export interface BoxProps
  extends NodeBaseProps,
    Omit<ComponentPropsWithoutRef<'div'>, 'style' | 'className' | 'id' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  /** Optional glyph, passed as a component (`icon={User}`). */
  icon?: LucideIcon
  label?: ReactNode
}

export function Box({ id, x, y, w, h, className, style, icon: Icon, label, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-box=""
      data-presentation-entity={id}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {label !== undefined ? <span data-presentation-box-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
