import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function sceneIdentity(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return sceneIds.get(scene)
}

export function Stage<TPayload>({ step, mode }: { step: Step<TPayload>; mode: Mode }) {
  const scale = useFitScale(mode)
  const { Scene, payload } = step
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', top: geometry.top,
    bottom: geometry.bottom, left: geometry.side, right: geometry.side, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
      <div data-presentation-canvas="" data-scale={scale} style={{ width: DESIGN_W, height: DESIGN_H,
        position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup>
          <AnimatePresence initial={false} mode="sync">
            <motion.div key={`${step.groupKey ?? step.id}:${sceneIdentity(Scene)}`} data-presentation-scene=""
              style={{ position: 'absolute', inset: 0 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}>
              <Scene payload={payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  </div>
}
