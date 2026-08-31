import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  mode: PresentationMode
}

export function Stage<TPayload>({ step, stepIndex, mode }: StageProps<TPayload>) {
  const scale = useFitScale(mode)
  const sceneKey = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  const Scene = step.Scene

  return (
    <div
      data-presentation-stage
      data-testid="presentation-stage"
      data-presentation-scale={scale.toFixed(4)}
      style={{ height: DESIGN_H * scale, overflow: 'hidden', position: 'relative', width: DESIGN_W * scale }}
    >
      <div style={{ height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_W }}>
        <LayoutGroup>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={sceneKey}
              data-presentation-scene
              initial={step.groupKey ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T, ease: EASE }}
              style={{ height: '100%', position: 'relative', width: '100%' }}
            >
              <Scene payload={step.payload} step={step} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
