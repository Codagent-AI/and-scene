import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'

/**
 * Entrance wrapper. A newcomer (`enter`, the default) waits `ENTER_DELAY` so
 * persisting entities finish their layout move first, then fades in. A
 * continuing entity (`enter={false}`) gets no entrance opacity or delay, so it
 * is never faded as a newcomer. Either way it fades out when its key leaves.
 */
export function Appear({
  enter = true,
  delay = ENTER_DELAY,
  ...rest
}: HTMLMotionProps<'div'> & { enter?: boolean; delay?: number }) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={enter ? { opacity: 0 } : false}
      animate={enter ? { opacity: 1, transition: { duration: ENTER_T, delay } } : { opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: ENTER_T } }}
      {...rest}
    />
  )
}
