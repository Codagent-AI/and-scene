import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_T } from '../constants'
// Mount this only around newcomers, never around continuing grouped entities.
export function Appear(props: HTMLMotionProps<'div'>) {
  return <motion.div data-presentation-appear="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={ENTER_T} {...props} />
}
