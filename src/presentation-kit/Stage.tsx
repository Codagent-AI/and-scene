import { useId } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'

// Component identity is part of the group key: two different Scenes must not share state.
const sceneIds = new WeakMap<object, number>()
function sceneId(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, ++sequence)
  return sceneIds.get(scene)
}
let sequence = 0
export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; mode: Mode; width?: number; height?: number }) {
  const fit = useFitScale(mode, width, height)
  const group = useId()
  const Scene = step.Scene
  const key = `${step.groupKey ?? step.id}:${sceneId(Scene)}`
  return <div data-presentation-stage="" style={{ position: 'absolute', left: fit.left, top: fit.top, width: fit.width, height: fit.height, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: width * fit.scale, height: height * fit.scale }}>
      <div data-presentation-canvas="" data-scale={fit.scale} style={{ width, height, position: 'relative', transformOrigin: 'top left', transform: `scale(${fit.scale})` }}>
        <LayoutGroup id={group}>
          <AnimatePresence initial={false}>
            <motion.div key={key} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', inset: 0 }}>
              <Scene payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  </div>
}
