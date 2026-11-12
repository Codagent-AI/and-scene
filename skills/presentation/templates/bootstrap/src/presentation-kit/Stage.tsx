import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import type { Step } from './types'
const scenes = new WeakMap<object, number>()
let sequence = 0
function sceneIdentity(scene: object) { if (!scenes.has(scene)) scenes.set(scene, ++sequence); return scenes.get(scene) }
export function Stage<T>({ step, scale }: { step: Step<T>; scale: number }) {
  const Scene = step.Scene
  const key = `${step.groupKey ?? step.id}:${sceneIdentity(Scene)}`
  return <div data-presentation-stage="" style={{ position: 'relative', width: DESIGN_W * scale, height: DESIGN_H * scale }}>
    <div data-presentation-canvas="" style={{ position: 'absolute', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup><AnimatePresence mode="sync"><motion.div key={key} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }} style={{ position: 'absolute', inset: 0 }}><Scene payload={step.payload} /></motion.div></AnimatePresence></LayoutGroup>
    </div>
  </div>
}
