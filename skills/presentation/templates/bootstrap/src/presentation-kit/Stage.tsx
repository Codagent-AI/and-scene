import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function identity(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return sceneIds.get(scene)
}
export function Stage<T>({ step }: { step: Step<T> }) {
  const { ref, scale } = useFitScale()
  const namespace = useId()
  const Scene = step.Scene
  return <div ref={ref} data-presentation-stage="" style={{ position: 'relative', minWidth: 0, minHeight: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
    <div data-presentation-canvas="" style={{ position: 'absolute', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup id={namespace}>
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={`${step.groupKey ?? step.id}:${identity(step.Scene)}`} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
