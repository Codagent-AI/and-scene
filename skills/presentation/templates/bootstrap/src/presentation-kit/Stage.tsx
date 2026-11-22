import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'
import type { Step, Mode } from './types'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'

export function Stage<T>({ step, stepIndex, mode, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; stepIndex: number; mode: Mode; width?: number; height?: number }) {
  const fit = useFitScale(mode, width, height)
  const Scene = step.Scene
  const [identity, setIdentity] = useState({ Scene, revision: 0 })
  if (identity.Scene !== Scene) setIdentity({ Scene, revision: identity.revision + 1 })
  return <div data-presentation-stage="" style={{ position: 'absolute', left: fit.left, top: fit.top, width: fit.width, height: fit.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width, height, transform: `scale(${fit.scale})`, transformOrigin: 'center', flexShrink: 0 }}>
      <LayoutGroup><AnimatePresence initial={false} mode="sync">
        <motion.div key={`${step.groupKey ?? step.id}:${identity.revision}`} data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T, ease: EASE }} style={{ position: 'absolute', inset: 0 }}>
          <Scene payload={step.payload} stepIndex={stepIndex} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
