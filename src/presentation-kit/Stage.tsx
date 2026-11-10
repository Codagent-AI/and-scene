import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneIdentity(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return sceneIds.get(scene)!
}
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const scale = useFitScale(mode, width, height)
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', inset: `${geometry.top}px ${geometry.side}px ${geometry.bottom}px`, display: 'grid', placeItems: 'center', touchAction: 'pan-y' }}>
    <div style={{ width: width * scale, height: height * scale }}>
      <div data-presentation-canvas="" style={{ width, height, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup><AnimatePresence initial={false} mode="sync">
          <motion.div key={`${step.groupKey ?? step.id}:${sceneIdentity(Scene)}`} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence></LayoutGroup>
      </div>
    </div>
  </div>
}
