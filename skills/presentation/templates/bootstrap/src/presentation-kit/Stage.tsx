import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

export function Stage<T>({ step, mode, className }: { step: Step<T>; mode: PresentationMode; className?: string }) {
  const scale = useFitScale(mode)
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  const sceneKey = step.groupKey ?? step.id
  return <div className={`presentation-stage ${className ?? ''}`} data-presentation-stage="" style={{ position: 'relative', width: DESIGN_W * scale, height: DESIGN_H * scale, marginTop: geometry.top, marginBottom: geometry.bottom }}>
    <div className="presentation-canvas" style={{ position: 'absolute', top: 0, left: 0, width: DESIGN_W, height: DESIGN_H, transformOrigin: 'top left', transform: `scale(${scale})` }}>
      <LayoutGroup id={`scene-${sceneKey}`}>
        <AnimatePresence initial={false}>
          <motion.div className="presentation-scene" key={sceneKey} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ position: 'absolute', inset: 0, width: DESIGN_W, height: DESIGN_H }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
