import { motion } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

export type AppearProps = NodeProps & {
  /**
   * True for an entity new in this step: it fades in only after persisting
   * entities finish their layout move. False for a continuing entity: no
   * newcomer fade. Keep one Appear per entity so toggling `enter` never remounts it.
   */
  enter?: boolean
}

export function Appear({ id, at, style, allowOverlap, enter = true, children, ...rest }: AppearProps) {
  const fade = enter
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: ENTER_DELAY, duration: ENTER_T, ease: EASE },
      }
    : {}
  return (
    <motion.div
      {...fade}
      exit={{ opacity: 0, transition: { duration: ENTER_T, ease: EASE } }}
      {...nodeAttrs('appear', id, allowOverlap)}
      data-presentation-enter={enter ? 'true' : 'false'}
      {...rest}
      style={placement(at, style)}
    >
      {children}
    </motion.div>
  )
}

