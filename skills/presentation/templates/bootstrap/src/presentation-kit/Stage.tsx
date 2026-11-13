import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion, useIsPresent } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { Scene, Step } from './types'
const sceneIds = new WeakMap<object, number>()
let serial = 0
function identity<T>(scene: Scene<T>) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, ++serial)
  return sceneIds.get(scene)
}
function SceneHost<T>({ step }: { step: Step<T> }) {
  const active = useIsPresent()
  const Component = step.Scene
  return <motion.div data-presentation-scene="" data-active={active} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T}><Component payload={step.payload} /></motion.div>
}
export function Stage<T>({ step }: { step: Step<T> }) {
  const area = useRef<HTMLDivElement>(null)
  const scale = useFitScale(area)
  const Component = step.Scene
  const sceneKey = `${step.groupKey ?? step.id}:${identity(Component)}`
  return <div ref={area} data-presentation-stage="" style={{ position: 'relative', minHeight: 0, overflow: 'hidden' }}>
    <div data-presentation-canvas="" style={{ position: 'absolute', left: '50%', top: '50%', width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup>
        <AnimatePresence initial={false} mode="sync">
          <SceneHost key={sceneKey} step={step} />
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
