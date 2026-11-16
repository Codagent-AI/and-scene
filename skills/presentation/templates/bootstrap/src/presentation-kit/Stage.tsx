import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

const identities = new WeakMap<object, number>()
let sequence = 0
function sceneIdentity(scene: object) {
  if (!identities.has(scene)) identities.set(scene, ++sequence)
  return identities.get(scene)
}
export function Stage<T>({ step, stepIndex, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: {
  step: Step<T>; stepIndex: number; mode: Mode; designWidth?: number; designHeight?: number
}) {
  const { scale } = useFitScale(mode, designWidth, designHeight)
  const geometry = STAGE_LAYOUT[mode]
  const Scene = step.Scene
  const sceneKey = `${sceneIdentity(Scene)}:${step.groupKey ?? step.id}`
  return <div data-presentation-stage="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: 0, right: 0, display: 'grid', placeItems: 'center' }}>
    <div data-presentation-canvas="" data-scale={scale} style={{ width: designWidth, height: designHeight, position: 'relative', flexShrink: 0, transform: `scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup><AnimatePresence initial={false} mode="sync">
        <motion.div key={sceneKey} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', inset: 0 }}>
          <Scene payload={step.payload} stepIndex={stepIndex} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
