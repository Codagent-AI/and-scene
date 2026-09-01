import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useRef } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
}

export function Stage<TPayload>({ step, stepIndex }: StageProps<TPayload>) {
  const fitTarget = useRef<HTMLDivElement>(null)
  const scale = useFitScale(fitTarget)
  const Scene = step.Scene
  const sceneKey = step.groupKey ?? step.id

  return (
    <div
      ref={fitTarget}
      data-presentation-stage="true"
      style={{ minHeight: 0, minWidth: 0, overflow: 'hidden', position: 'relative' }}
    >
      <div
        data-presentation-canvas="true"
        style={{
          height: DESIGN_H * scale,
          position: 'absolute',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: DESIGN_W,
        }}
      >
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={sceneKey}
              data-presentation-scene="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
              style={{ height: DESIGN_H, position: 'relative', width: DESIGN_W }}
            >
              <Scene payload={step.payload} step={step} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
