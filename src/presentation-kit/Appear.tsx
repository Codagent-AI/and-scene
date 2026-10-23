import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T } from './constants'

export interface AppearProps {
  /** Identity of the wrapped entity, exposed as data-presentation-appear-id. */
  id?: string
  className?: string
  style?: CSSProperties
  /**
   * False for continuing entities: they keep the same wrapper and skip the entry
   * animation, so they morph instead of fading.
   */
  entering?: boolean
  children: ReactNode
}

/** Wraps an entity so newcomers fade in after persisting entities have finished morphing. */
export function Appear({ id, className, style, entering = true, children }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear={entering ? 'entering' : 'continuing'}
      data-presentation-appear-id={id}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
      initial={entering ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={entering ? { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}
