import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
// React component identity is part of a scene group: replacing its component
// must give AnimatePresence a new child while payload-only updates stay mounted.
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function transitionKey<T>(step: Step<T>) {
  if (!sceneIds.has(step.Scene)) sceneIds.set(step.Scene, nextSceneId++)
  return JSON.stringify([step.groupKey ?? step.id, sceneIds.get(step.Scene)])
}
export function Stage<T>({ step, mode }: { step: Step<T>; mode: Mode }) {
  const scale = useFitScale(mode)
  const Scene = step.Scene
  return <div data-presentation-stage style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative', flexShrink: 0 }}>
    <div data-presentation-canvas style={{ position: 'absolute', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup><AnimatePresence initial={false} mode="sync">
        <motion.div key={transitionKey(step)} data-presentation-scene style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}>
          <Scene payload={step.payload} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
