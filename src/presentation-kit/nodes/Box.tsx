import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { appearMotion } from './appear'

export interface EntityProps {
  /** Stable identity: used as the motion `layoutId` and the entity hook. */
  id: string
  x: number
  y: number
  w?: number
  h?: number
  /** Marks the entity as emphasized (hook only; the presentation decides how it looks). */
  emphasis?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
  [dataAttr: `data-${string}`]: string | number | boolean | undefined
}

export interface BoxProps extends EntityProps {
  label?: ReactNode
  /** A lucide icon component, e.g. `Icon={User}`. */
  Icon?: LucideIcon
  /** Hook value for `data-presentation-kind`. */
  kind?: string
}

/**
 * The generic positioned entity. Position, size, label and emphasis changes between steps
 * morph in place through layout projection.
 */
export function Box({
  id,
  x,
  y,
  w,
  h,
  emphasis,
  label,
  Icon,
  kind = 'box',
  className,
  style,
  children,
  ...rest
}: BoxProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...appearMotion}
      data-presentation-entity={id}
      data-presentation-kind={kind}
      data-presentation-emphasis={emphasis ? 'true' : undefined}
      className={className}
      style={{ position: 'absolute', left: x, top: y, width: w, height: h, ...style }}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {label !== undefined ? <span data-presentation-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
