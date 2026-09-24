import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useRef } from 'react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import type { PresentationMode, Step } from './types'
import { useFitScale } from './useFitScale'

export function Stage<T>({ step, index, steps, mode }: { step: Step<T>; index: number; steps: Step<T>[]; mode: PresentationMode }) {
  const frame = useRef<HTMLDivElement>(null)
  const scale = useFitScale(frame)
  const grouped = Boolean(step.groupKey && steps.some((neighbor) => neighbor.groupKey === step.groupKey && neighbor.Scene === step.Scene))
  const SceneComponent = step.Scene
  const current = <SceneComponent payload={step.payload as T} step={step} index={index} />
  const geometry = STAGE_LAYOUT[mode]
  return <div ref={frame} className="presentation-stage" data-presentation-stage="" style={{ position: 'absolute', inset: `${geometry.top}px 0 ${geometry.bottom}px` }}>
    <div className="presentation-canvas" style={{ position: 'absolute', left: '50%', top: '50%', width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center' }}>
      <LayoutGroup id="presentation-scene">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div key={grouped ? step.groupKey : step.id} className="presentation-scene-host" data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {current}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
