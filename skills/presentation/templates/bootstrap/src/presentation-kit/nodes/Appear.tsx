import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_T } from '../constants'
// Use only for an independently keyed newcomer, not a wrapper around persisting entities.
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} {...props} />
}
