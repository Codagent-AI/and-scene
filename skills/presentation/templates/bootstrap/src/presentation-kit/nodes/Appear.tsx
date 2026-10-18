import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
import { useStageState } from '../stageContext'
import { EXIT } from './shared'

export interface AppearProps {
  children?: ReactNode
  /** Seconds before entering. Defaults to after persisting entities finish moving. */
  delay?: number
}

/**
 * Wraps a newcomer so it fades in only after continuing entities have settled.
 * Continuing entities must not be wrapped; they morph through their layoutId.
 */
export function Appear({ children, delay = LAYOUT_T + ENTER_DELAY }: AppearProps) {
  const { instant } = useStageState()
  return (
    <motion.div
      data-presentation-appear=""
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      initial={instant ? false : { opacity: 0 }}
      animate={{ opacity: 1, transition: { delay, duration: ENTER_T, ease: EASE } }}
      exit={EXIT}
    >
      {children}
    </motion.div>
  )
}
