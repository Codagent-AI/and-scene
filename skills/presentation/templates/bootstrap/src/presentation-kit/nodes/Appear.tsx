import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { APPEAR_ANIMATE, APPEAR_EXIT, APPEAR_INITIAL } from './motion'

/**
 * Fades arbitrary newcomer content (for example a raw `motion` element) in after persisting
 * entities have finished their layout morph. Primitives take `enter` instead, which needs no
 * wrapper: use `Appear` only around content that has no `enter` prop, and only in the step that
 * introduces it, since adding or removing a wrapper remounts what it wraps.
 */
export function Appear({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  /** Author-owned style; wins over the kit's positioning. */
  style?: CSSProperties
}) {
  return (
    <motion.div
      initial={APPEAR_INITIAL}
      animate={APPEAR_ANIMATE}
      exit={APPEAR_EXIT}
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      data-presentation-appear=""
    >
      {children}
    </motion.div>
  )
}
