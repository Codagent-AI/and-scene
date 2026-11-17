import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneIdentity(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return sceneIds.get(scene)
}
export function Stage<T>({ step, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: {
  step: Step<T>; mode: Mode; designWidth?: number; designHeight?: number
}) {
  const { left, top, width, height, scale } = useFitScale(mode, designWidth, designHeight)
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'absolute', left, top, width, height, display: 'grid', placeItems: 'center' }}>
    <div data-presentation-canvas="" style={{ width: designWidth, height: designHeight, left: '50%', top: '50%', position: 'absolute', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup><AnimatePresence initial={false}>
        <motion.div key={JSON.stringify([step.groupKey === undefined ? 'step' : 'group', step.groupKey ?? step.id, sceneIdentity(Scene)])} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
          <Scene payload={step.payload} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
