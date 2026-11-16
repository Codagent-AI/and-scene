import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Scene, Step } from './types'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
const identities = new WeakMap<object, number>()
let serial = 0
function sceneKey<T>(scene: Scene<T>, group: string) {
  if (!identities.has(scene)) identities.set(scene, ++serial)
  return `${identities.get(scene)}:${group}`
}
export function Stage<T>({ step, scale, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; scale: number; width?: number; height?: number }) {
  const Scene = step.Scene
  return <div data-presentation-canvas="" style={{ width, height, flexShrink: 0, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'center' }}>
    <LayoutGroup><AnimatePresence mode="sync">
      <motion.div key={sceneKey(Scene, step.groupKey ?? step.id)} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
        <Scene payload={step.payload} step={step} />
      </motion.div>
    </AnimatePresence></LayoutGroup>
  </div>
}
