import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T } from './constants'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
import type { PresentationMode } from './types'

export function Stage<T>({ step, mode }: { step: Step<T>; mode: PresentationMode }) {
  const scale = useFitScale(mode)
  const Scene = step.Scene
  const sceneKey = `${step.groupKey ?? step.id}:${Scene.displayName ?? Scene.name}`
  return <div className="presentation-stage" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }} data-presentation-stage="" data-mode={mode} onTouchStartCapture={undefined}>
    <div className="presentation-canvas-viewport" style={{ position: 'relative', width: DESIGN_W * scale, height: DESIGN_H * scale }}>
      <div className="presentation-canvas" style={{ position: 'absolute', left: 0, top: 0, transformOrigin: 'top left', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, pointerEvents: 'auto' }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div className="presentation-scene" data-presentation-scene="" key={sceneKey}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T }}>
              <Scene payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
    <span hidden data-presentation-enter-delay={ENTER_DELAY} />
  </div>
}
