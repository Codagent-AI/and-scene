import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_T } from '../constants'
/** Keep each Appear keyed by entity identity and mounted across grouped beats. */
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} {...props} />
}
