import { useId } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'

const sceneKeys = new WeakMap<object, number>()
let nextSceneKey = 0
function sceneKey(scene: object) {
  if (!sceneKeys.has(scene)) sceneKeys.set(scene, nextSceneKey++)
  return sceneKeys.get(scene)
}

export interface StageProps<T> {
  step: Step<T>
  stepIndex: number
  scale: number
  width?: number
  height?: number
}
export function Stage<T>({ step, stepIndex, scale, width = DESIGN_W, height = DESIGN_H }: StageProps<T>) {
  const scope = useId()
  const ActiveScene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: width * scale, height: height * scale, position: 'relative' }}>
      <div data-presentation-canvas="" style={{ width, height, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup id={scope}>
          <AnimatePresence initial={false} mode="sync">
            <motion.div key={`${step.groupKey ?? step.id}:${sceneKey(ActiveScene)}`} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }} style={{ position: 'absolute', inset: 0 }}>
              <ActiveScene payload={step.payload} stepIndex={stepIndex} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  </div>
}
