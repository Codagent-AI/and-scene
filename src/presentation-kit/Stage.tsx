import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import type { Step, PresentationMode } from './types'
import { useFitScale } from './useFitScale'

export function Stage<TPayload>({ step, index, mode }: { step: Step<TPayload>; index: number; mode: PresentationMode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const scale = useFitScale(container, mode)
  const Scene = step.Scene
  const identity = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  return <section ref={setContainer} aria-label="Presentation scene" data-presentation-stage="true" style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
    <LayoutGroup id="presentation-scene"><div data-presentation-canvas="true" style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', left: '50%', top: '50%', marginLeft: -DESIGN_W / 2, marginTop: -DESIGN_H / 2, transform: `scale(${scale})`, transformOrigin: 'center' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={identity} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: LAYOUT_T, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.2 } }} style={{ position: 'absolute', inset: 0 }}>
          <Scene payload={step.payload} step={step} index={index} />
        </motion.div>
      </AnimatePresence>
    </div></LayoutGroup>
  </section>
}
