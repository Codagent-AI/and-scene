import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE, EXIT_T, LAYOUT_T } from '../constants'

export interface EntityProps {
  /** Stable identity, used as the motion layoutId. */
  id: string
  /** Design-canvas coordinates; when `x` or `y` is given the entity is absolutely positioned. */
  x?: number
  y?: number
  width?: number
  height?: number
  className?: string
  style?: CSSProperties
  /** Fade in after persisting entities have settled. Use only for newcomers. */
  appear?: boolean
  /** Marks a subtree whose overlaps are intentional. */
  allowOverlap?: boolean
  children?: ReactNode
}

export interface KindProps extends EntityProps {
  kind: string
  'aria-hidden'?: boolean
}

/** Base motion element: stable id, layout morph, exit, and style hooks. */
export function Entity({
  id,
  kind,
  x,
  y,
  width,
  height,
  className,
  style,
  appear,
  allowOverlap,
  children,
  ...rest
}: KindProps) {
  const positioned = x !== undefined || y !== undefined
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-entity={id}
      data-presentation-kind={kind}
      data-presentation-allow-overlap={allowOverlap ? '' : undefined}
      className={className}
      style={{
        ...(positioned ? { position: 'absolute' as const, left: x ?? 0, top: y ?? 0 } : null),
        ...(width !== undefined ? { width } : null),
        ...(height !== undefined ? { height } : null),
        ...style,
      }}
      initial={appear ? { opacity: 0 } : undefined}
      animate={
        appear
          ? { opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }
          : undefined
      }
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
