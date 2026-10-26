import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  stepCount: number
  mode: PresentationMode
}

export function Stage<TPayload>({ step, stepIndex, stepCount, mode }: StageProps<TPayload>) {
  const scale = useFitScale(mode)
  const Scene = step.Scene
  const sceneKey = step.groupKey ?? step.id

  return (
    <section
      data-presentation-stage="true"
      data-presentation-stage-mode={mode}
      style={{ height: DESIGN_H * scale, width: DESIGN_W * scale }}
    >
      <div
        data-presentation-canvas="true"
        style={{ height: DESIGN_H, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_W }}
      >
        <LayoutGroup id="presentation-scene">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              animate={{ opacity: 1 }}
              data-presentation-scene={sceneKey}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={sceneKey}
              style={{ height: '100%', position: 'absolute', width: '100%' }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
            >
              <Scene payload={step.payload} step={step} stepCount={stepCount} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  )
}
