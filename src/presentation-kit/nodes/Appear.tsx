import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_T } from '../constants'
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0, transition: { delay: 0, duration: 0.18 } }} transition={ENTER_T} {...props} />
}
