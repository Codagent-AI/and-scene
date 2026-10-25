import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import type { ComponentType } from 'react'
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneId<T>(Scene: ComponentType<T>) {
  if (!sceneIds.has(Scene)) sceneIds.set(Scene, nextSceneId++)
  return sceneIds.get(Scene)
}
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT, ENTER_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
export function Stage<T>({ step, mode }: { step: Step<T>; mode: Mode }) {
  const scale = useFitScale(mode), id = useId()
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'absolute', top: STAGE_LAYOUT[mode].top, bottom: STAGE_LAYOUT[mode].bottom, left: 0, right: 0, display: 'grid', placeItems: 'center' }}>
    <div data-presentation-canvas="" style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})` }}>
      <LayoutGroup id={id}><AnimatePresence mode="sync"><motion.div key={`${sceneId(step.Scene)}:${step.groupKey ?? step.id}`} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }}><Scene payload={step.payload} /></motion.div></AnimatePresence></LayoutGroup>
    </div>
  </div>
}
