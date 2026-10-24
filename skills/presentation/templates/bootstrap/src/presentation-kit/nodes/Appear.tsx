import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
import { EXIT } from './shared'

export interface AppearProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'> {
  /** Seconds to wait before entering; defaults to after continuing entities settle. */
  delay?: number
}

export const NEWCOMER_DELAY = LAYOUT_T + ENTER_DELAY

/**
 * Wraps a newcomer entity. It fades in once, after persisting entities have
 * finished moving, and fades out when it leaves. Wrap only newcomers: entities
 * that continue across steps rely on `layoutId` morphs and need no wrapper
 * re-triggering.
 */
export function Appear({ delay = NEWCOMER_DELAY, style, ...rest }: AppearProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay, duration: ENTER_T, ease: EASE } }}
      exit={EXIT}
      data-presentation-appear=""
      data-presentation-appear-delay={delay}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
      {...rest}
    />
  )
}
