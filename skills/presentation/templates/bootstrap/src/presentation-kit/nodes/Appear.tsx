import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'
export const appearance = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }, exit: { opacity: 0, transition: { duration: ENTER_T } } }
// Mount only around new entities, never around an entire continuing grouped scene.
export function Appear({ children }: { children: ReactNode }) {
  return <motion.div data-presentation-appear="" {...appearance} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{children}</motion.div>
}
