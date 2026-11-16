import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
// Component identity is part of a scene group: the same group with another
// Scene must leave through AnimatePresence rather than replacing its child.
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneKey(scene: object, group: string | undefined, stepId: string) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return JSON.stringify([group === undefined ? 'step' : 'group', group ?? stepId, sceneIds.get(scene)])
}
export function Stage<T>({ step, mode, designW = DESIGN_W, designH = DESIGN_H }: { step: Step<T>; mode: Mode; designW?: number; designH?: number }) {
  const scale = useFitScale(mode, designW, designH), id = useId()
  const { Scene } = step
  return <div data-presentation-stage="" style={{ position: 'absolute', top: STAGE_LAYOUT[mode].top, bottom: STAGE_LAYOUT[mode].bottom, left: 0, right: 0 }}>
    <div data-presentation-canvas="" style={{ position: 'absolute', left: '50%', top: '50%', width: designW, height: designH, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup id={id}><AnimatePresence initial={false}>
        <motion.div key={sceneKey(Scene, step.groupKey, step.id)} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: ENTER_T } }}>
          <Scene payload={step.payload} step={step} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
