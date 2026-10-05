import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'

interface StageProps<T> { steps: readonly Step<T>[]; index: number; mode: PresentationMode; width?: number; height?: number }

export function Stage<T>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: StageProps<T>) {
  const step = steps[index]
  const scale = useFitScale(width, height, mode)
  const key = `${step.groupKey ?? step.id}:${step.Scene.displayName ?? step.Scene.name}`
  const Scene = step.Scene
  return <div className="presentation-stage" data-presentation-stage="" data-presentation-mode={mode}>
    <div className="presentation-stage__viewport" style={{ width: width * scale, height: height * scale }}>
      <motion.div className="presentation-stage__canvas" data-presentation-canvas="" style={{ width, height, transform: `scale(${scale})` }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div className="presentation-scene" data-presentation-scene="" key={key}>
              <Scene payload={step.payload} step={step} stepIndex={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  </div>
}
