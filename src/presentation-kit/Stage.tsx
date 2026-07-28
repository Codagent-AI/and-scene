import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'

export interface StageProps<TPayload> {
  steps: Step<TPayload>[]
  activeIndex: number
  mode: PresentationMode
  scale?: number
}

function segmentKey(step: { id: string; groupKey?: string }): string {
  return step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
}

export function Stage<TPayload>({ steps, activeIndex, mode, scale = 1 }: StageProps<TPayload>) {
  const step = steps[activeIndex]
  if (!step) return null
  const { Scene } = step

  return (
    <div
      data-presentation-chrome="stage"
      data-presentation-mode={mode}
      style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}
    >
      <LayoutGroup>
        <AnimatePresence initial={false}>
          <motion.div
            key={segmentKey(step)}
            data-presentation-node="scene-host"
            style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Scene payload={step.payload} active />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}
