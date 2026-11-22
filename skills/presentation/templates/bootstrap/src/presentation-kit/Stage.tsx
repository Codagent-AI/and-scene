import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
import { useId } from 'react'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneId(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, ++nextSceneId)
  return sceneIds.get(scene)
}

export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const scale = useFitScale(mode, width, height)
  const instance = useId()
  // Both the group and component identity participate in React reconciliation.
  const Scene = step.Scene
  return <div data-presentation-stage-viewport="" style={{ position: 'absolute', inset: `${STAGE_LAYOUT[mode].top}px 0 ${STAGE_LAYOUT[mode].bottom}px`, overflow: 'hidden' }}>
    <div data-presentation-stage="" style={{ position: 'absolute', left: '50%', top: '50%', width, height, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center', flexShrink: 0 }}>
      <LayoutGroup id={instance}>
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={JSON.stringify([step.groupKey ?? step.id, sceneId(Scene)])} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
