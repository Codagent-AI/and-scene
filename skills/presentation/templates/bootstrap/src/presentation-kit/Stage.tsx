import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { useFitScale, useViewportSize } from './useFitScale.ts'
import type { IndexedStep, PresentationMode } from './types.ts'

type StageProps<TPayload> = {
  step: IndexedStep<TPayload>
  mode: PresentationMode
}

export function Stage<TPayload>({ step, mode }: StageProps<TPayload>) {
  const viewport = useViewportSize()
  const scale = useFitScale(viewport.width, viewport.height, mode)
  const Scene = step.Scene
  const sceneKey = step.groupKey ?? step.id

  return (
    <div className="presentation-stage-viewport" data-presentation-stage>
      <div
        className="presentation-stage-frame"
        style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}
        data-stage-scale={scale.toFixed(4)}
      >
        <div
          className="presentation-stage-canvas"
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
          data-stage-width={DESIGN_W}
          data-stage-height={DESIGN_H}
        >
          <LayoutGroup>
            <AnimatePresence initial={false} mode="sync">
              <motion.div
                key={sceneKey}
                className="presentation-scene-host"
                data-scene-group={step.groupKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Scene payload={step.payload} step={step} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
