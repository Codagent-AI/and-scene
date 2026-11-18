import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
// Component identity is part of the presence key: a shared group only persists
// when both the group and the actual Scene component are unchanged.
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function presenceKey(scene: object, group: string | undefined, stepId: string) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return JSON.stringify([group === undefined ? 'step' : 'group', group ?? stepId, sceneIds.get(scene)])
}
export function Stage<T>({ step, index, mode }: { step: Step<T>; index: number; mode: Mode }) {
  const scale = useFitScale(mode)
  const namespace = useId()
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, flexShrink: 0 }}>
      <LayoutGroup id={namespace}>
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={presenceKey(Scene, step.groupKey, step.id)} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }}>
            <Scene payload={step.payload} step={step} index={index} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
