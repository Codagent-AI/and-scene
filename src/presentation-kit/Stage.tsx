import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { Step } from './types'

type StageProps<TPayload> = {
  step: Step<TPayload>
  stepIndex: number
  stepCount: number
}

export function Stage<TPayload>({ step, stepIndex, stepCount }: StageProps<TPayload>) {
  const { scale, setContainer } = useFitScale()
  const sceneKey = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  const Scene = step.Scene

  return (
    <div
      ref={setContainer}
      data-presentation-stage="true"
      style={{ minHeight: DESIGN_H, overflow: 'hidden', position: 'relative' }}
    >
      <div
        data-presentation-canvas="true"
        style={{
          height: DESIGN_H,
          left: '50%',
          position: 'absolute',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
          width: DESIGN_W,
        }}
      >
        <LayoutGroup id="presentation-scene">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={sceneKey}
              data-presentation-scene="true"
              data-presentation-scene-group={step.groupKey ?? undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
              style={{ height: '100%', position: 'absolute', width: '100%' }}
            >
              <Scene payload={step.payload} step={step} stepIndex={stepIndex} stepCount={stepCount} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
