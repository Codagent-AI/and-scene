import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
import type { PresentationMode } from './types'

export function Stage<TPayload>({ step, index, mode, designWidth, designHeight }: { step: Step<TPayload>; index: number; mode: PresentationMode; designWidth: number; designHeight: number }) {
  const scale = useFitScale(mode, designWidth, designHeight)
  const Scene = step.Scene
  return <div className="presentation-stage" data-presentation-stage="" style={{ width: designWidth * scale, height: designHeight * scale }}>
    <div className="presentation-canvas" data-presentation-canvas="" style={{ width: designWidth, height: designHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup id="presentation-scene">
        <AnimatePresence mode="sync" initial={false}>
          {step.groupKey ? <div key={step.groupKey} className="presentation-scene" data-presentation-scene=""><Scene payload={step.payload} step={step} index={index} /></div> : <motion.div key={step.id} className="presentation-scene" data-presentation-scene="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><Scene payload={step.payload} step={step} index={index} /></motion.div>}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
