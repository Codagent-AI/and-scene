import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, Step } from './types'

export function Stage<T>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H, touchHandlers }: {
  steps: readonly Step<T>[]; index: number; mode: PresentationMode; width?: number; height?: number
  touchHandlers: { onTouchStart: (event: React.TouchEvent) => void; onTouchEnd: (event: React.TouchEvent) => void }
}) {
  const step = steps[index]
  const scale = useFitScale(mode, width, height)
  const previous = steps[index - 1]
  const sceneKey = step.groupKey ?? step.id
  const sameGroup = previous?.groupKey && previous.groupKey === step.groupKey && previous.Scene === step.Scene
  const Scene = step.Scene
  const scene = <Scene payload={step.payload} step={step} index={index} total={steps.length} />
  return <div className="presentation-stage" data-presentation-stage="" data-mode={mode} {...touchHandlers}>
    <div className="presentation-canvas-viewport" style={{ width: width * scale, height: height * scale }}>
      <div className="presentation-canvas" data-presentation-canvas="" style={{ width, height, transform: `scale(${scale})` }}>
        <LayoutGroup id={sceneKey}>
          <AnimatePresence mode="wait">
            <motion.div key={sceneKey} className="presentation-scene" data-presentation-scene="" initial={{ opacity: sameGroup ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {scene}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  </div>
}
