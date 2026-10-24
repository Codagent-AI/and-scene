import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE, EXIT_T } from '../constants.ts'

export interface AppearProps {
  children?: ReactNode
  /** Seconds to wait before fading in; defaults to after persisting entities settle. */
  delay?: number
  className?: string
  style?: CSSProperties
  [dataAttribute: `data-${string}`]: string | undefined
}

/**
 * Wraps a newcomer: it fades in once persisting entities have finished moving and
 * fades out when removed. Place it directly inside `SceneLayer`. Entities that keep
 * existing across steps stay mounted, so this wrapper never replays for them.
 */
export function Appear({ children, delay = ENTER_DELAY, className, style, ...rest }: AppearProps) {
  return (
    <motion.div
      {...rest}
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay, duration: ENTER_T, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
      data-presentation-appear=""
    >
      {children}
    </motion.div>
  )
}
