import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE, ENTER_T } from '../constants'

export interface EmphasisProps {
  active: boolean
  layoutId: string
  className?: string
  children?: ReactNode
}

/** Toggleable highlight/marker entity that fades in and out with its own identity. */
export function Emphasis({ active, layoutId, className, children }: EmphasisProps) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key={layoutId}
          layoutId={layoutId}
          data-presentation-emphasis=""
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: ENTER_T, ease: EASE }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
