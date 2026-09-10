import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

interface StageProps<TPayload> {
  step: Step<TPayload>
  index: number
  mode: PresentationMode
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
}

export function Stage<TPayload>({ step, index, mode, onTouchStart, onTouchEnd }: StageProps<TPayload>) {
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const scale = useFitScale(stage, mode)
  const Scene = step.Scene
  const sceneKey = step.groupKey ?? step.id
  return <section ref={setStage} className="presentation-stage" data-presentation-stage onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ display: 'grid', gridRow: 3, minHeight: 0, minWidth: 0, overflow: 'hidden', placeItems: 'center' }}>
    <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
      <div data-testid="presentation-canvas" data-presentation-canvas data-design-width={DESIGN_W} data-design-height={DESIGN_H} style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup id={sceneKey}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={sceneKey} className="presentation-scene" data-presentation-scene data-presentation-scene-group={step.groupKey} initial={step.groupKey ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: ENTER_T, ease: EASE }}>
              <Scene payload={step.payload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  </section>
}
