import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0
function identity(scene: object) {
  if (!sceneIds.has(scene)) sceneIds.set(scene, nextSceneId++)
  return sceneIds.get(scene)
}

export function Stage<T>({ step, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: { step: Step<T>; mode: Mode; designWidth?: number; designHeight?: number }) {
  const fit = useFitScale(mode, designWidth, designHeight)
  const namespace = useId()
  const Scene = step.Scene
  // Scene type is part of identity: a different component remounts even for the same group key.
  return <div data-presentation-stage="" style={{ position: 'absolute', left: fit.left, top: fit.top, width: fit.width, height: fit.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width: designWidth, height: designHeight, transform: `scale(${fit.scale})`, flexShrink: 0 }}>
      <LayoutGroup id={namespace}>
        <AnimatePresence initial={false}>
          <motion.div key={`${step.groupKey ?? step.id}:${identity(Scene)}`} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }}>
            <Scene payload={step.payload} step={step} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
