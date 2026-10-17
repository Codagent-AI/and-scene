import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../constants.ts'

export interface AppearProps {
  /** Entity presence: entering waits for persisting entities to settle; leaving animates out. */
  when?: boolean
  id?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Sequences a newcomer after continuing motion and animates it out when `when` turns false. */
export function Appear({ when = true, id, className, style, children }: AppearProps) {
  return (
    <AnimatePresence>
      {when ? (
        <motion.div
          key="appear"
          data-presentation-appear=""
          data-presentation-id={id}
          className={className}
          style={style}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: EXIT_T } }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
