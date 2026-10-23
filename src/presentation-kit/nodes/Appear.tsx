import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_ANIMATE, EXIT_ANIMATE } from '../constants'

const LAYER = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
} as const

/** Fades a newcomer in only after continuing entities finish their layout motion. */
export function Appear({ style, ...props }: Omit<HTMLMotionProps<'div'>, 'initial' | 'animate'>) {
  return (
    <motion.div
      exit={EXIT_ANIMATE}
      {...props}
      data-presentation-appear
      initial={{ opacity: 0 }}
      animate={ENTER_ANIMATE}
      style={{ ...LAYER, ...style }}
    />
  )
}
