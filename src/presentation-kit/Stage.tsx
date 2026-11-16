import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import type { Step } from './types'
import { useFitScale } from './useFitScale'

const componentIds = new WeakMap<object, number>()
let nextComponentId = 0
function sceneKey<T>(step: Step<T>) {
  if (!componentIds.has(step.Scene)) componentIds.set(step.Scene, ++nextComponentId)
  return `${componentIds.get(step.Scene)}:${step.groupKey ?? step.id}`
}
export function Stage<T>({ step, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; width?: number; height?: number }) {
  const { ref, scale } = useFitScale(width, height)
  const Scene = step.Scene
  return <div ref={ref} data-presentation-stage="" style={{ position: 'relative', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
    <div data-presentation-canvas="" style={{ position: 'absolute', width, height, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup>
        <AnimatePresence initial={false}>
          <motion.div key={sceneKey(step)} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', inset: 0 }}>
            <Scene step={step} payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
