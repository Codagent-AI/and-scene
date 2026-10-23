import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'
import { placeStyle, type Rect } from './geometry'

export interface AppearProps extends Omit<HTMLMotionProps<'div'>, 'id'> {
  at?: Rect
  /** Seconds to wait before entering; defaults to ENTER_DELAY so persisting entities settle first. */
  delay?: number
}

/**
 * Wraps newcomers only. Place it inside `AnimatePresence` so departures fade out too.
 * It fills the canvas by default so children keep their canvas coordinates.
 */
export function Appear({ at, delay = ENTER_DELAY, style, ...rest }: AppearProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
      data-presentation-appear=""
      {...rest}
      style={at ? placeStyle(at, style) : { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  )
}
