import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'

export function Stage<T>({ step, mode, width = DESIGN_W, height = DESIGN_H, direction = 1 }: { step: Step<T>; mode: 'browse' | 'present'; width?: number; height?: number; direction?: number }) {
  const scale = useFitScale(width, height, mode)
  const Scene = step.Scene
  return <div className="presentation-stage" data-presentation-stage="" data-mode={mode} style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', pointerEvents: 'none' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width, height, transform: `scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup id={step.groupKey ?? step.id}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div key={step.groupKey ?? step.id} data-presentation-scene="" style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
    <span hidden data-enter-delay={ENTER_DELAY} data-enter-duration={ENTER_T} />
  </div>
}
