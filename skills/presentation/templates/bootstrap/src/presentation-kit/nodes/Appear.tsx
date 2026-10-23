import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

/**
 * Entry wrapper for newcomers. Starts hidden and fades in after persisting
 * entities settle. Never wrap a continuing entity in it.
 */
export function Appear({ style, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0, duration: LAYOUT_T, ease: EASE } }}
      transition={{ delay: ENTER_DELAY, duration: ENTER_T, ease: EASE }}
      style={{ position: 'absolute', left: 0, top: 0, ...style }}
      {...rest}
    />
  )
}
