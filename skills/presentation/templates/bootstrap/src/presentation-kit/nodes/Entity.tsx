import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface EntityProps extends Geometry {
  /** Stable entity identity, used as the layoutId. */
  id: string
  /** Value of the `data-presentation-node` hook. */
  kind: string
  className?: string
  style?: CSSProperties
  /** Ignores pointer input. */
  inert?: boolean
  /** Hides a purely decorative entity from assistive technology. */
  decorative?: boolean
  children?: ReactNode
}

/** The layout-animated, hook-carrying element shared by every positioned node primitive. */
export function Entity({ id, kind, className, style, inert, decorative, children, ...geometry }: EntityProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      aria-hidden={decorative || undefined}
      data-presentation-node={kind}
      data-presentation-id={id}
      className={className}
      style={{ ...(inert ? { pointerEvents: 'none' as const } : null), ...geometryStyle(geometry, style) }}
    >
      {children}
    </motion.div>
  )
}
