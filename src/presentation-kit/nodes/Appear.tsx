import { useContext } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants'
import { StageContext } from '../stageContext'

/**
 * Wraps a newcomer so it fades in after persisting entities have moved, and fades out when it
 * leaves (inside an `AnimatePresence`). Do not wrap entities that continue across steps.
 */
export function Appear({ children, delay = ENTER_DELAY }: { children: ReactNode; delay?: number }) {
  const { hasNavigated } = useContext(StageContext)
  return (
    <motion.div
      data-presentation-appear
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: hasNavigated ? delay : 0 } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T } }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  )
}
