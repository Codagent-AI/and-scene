import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from './constants'
import type { PresentationMode, Step } from './types'

export function Stage<TPayload>({ step, scale, mode, stepNumber, className }: { step: Step<TPayload>; scale: number; mode: PresentationMode; stepNumber: number; className?: string }) {
  const Scene = step.Scene
  const meta = { id: step.id, era: step.era, title: step.title, caption: step.caption, number: stepNumber }
  return <div className={['presentation-stage-viewport', className].filter(Boolean).join(' ')} data-presentation-stage-viewport>
    <div className="presentation-stage-space" style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
      <LayoutGroup id="and-scene">
        <div className="presentation-stage" data-presentation-stage style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={step.groupKey ?? step.id} className="presentation-scene" data-presentation-scene data-scene-key={step.groupKey ?? step.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T }}>
              <AnimatePresence mode="popLayout"><Scene payload={step.payload} step={meta} /></AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
    <span className="presentation-stage-mode" data-presentation-mode={mode} hidden />
  </div>
}

export { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T }
