import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'
export function Stage<T>({ step, mode }: { step: Step<T>; mode: Mode }) {
  const stage = useRef<HTMLDivElement>(null)
  const scale = useFitScale(mode, stage)
  const geometry = STAGE_LAYOUT[mode]
  const Scene = step.Scene
  return <div ref={stage} data-presentation-stage="" style={{ position: 'absolute', top: geometry.top, bottom: geometry.bottom, left: 0, right: 0, display: 'grid', placeItems: 'center' }}>
    <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
      <div data-presentation-canvas="" style={{ position: 'relative', width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <LayoutGroup><AnimatePresence initial={false} mode="sync">
          <motion.div key={step.groupKey ?? step.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={LAYOUT_T} style={{ position: 'absolute', inset: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence></LayoutGroup>
      </div>
    </div>
  </div>
}
