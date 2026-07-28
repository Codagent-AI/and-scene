import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { EASE, LAYOUT_T } from './constants'
import type { Step } from './types'

export interface StageProps<TPayload> {
  steps: Step<TPayload>[]
  activeIndex: number
}

/**
 * Steps that share a groupKey and Scene component render under the same React
 * key, so React updates the existing Scene instance with new payload instead
 * of remounting it. Steps outside a group (or the group boundary) get a
 * unique key, which cross-fades via AnimatePresence.
 */
export function Stage<TPayload>({ steps, activeIndex }: StageProps<TPayload>) {
  const step = steps[activeIndex]
  const renderKey = step.groupKey ?? step.id
  const Scene = step.Scene

  return (
    <div data-presentation-stage="">
      <LayoutGroup>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={renderKey}
            data-presentation-scene-host=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: LAYOUT_T, ease: EASE }}
          >
            <Scene payload={step.payload} stepIndex={activeIndex} isActive />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}
