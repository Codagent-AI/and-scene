import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'
export function Stage<T>({ steps, index, mode }: { steps: readonly Step<T>[]; index: number; mode: PresentationMode }) {
 const step = steps[index]!; const scale = useFitScale(mode); const Component = step.Scene
 const scene = <Component payload={step.payload} stepIndex={index} />
 const geometry = STAGE_LAYOUT[mode]
 return <div data-presentation-stage style={{ position: 'absolute', top: geometry.header, bottom: geometry.footer, left: 0, right: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
  <div style={{ width: DESIGN_W, height: DESIGN_H, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
   <LayoutGroup id="presentation-scene"><AnimatePresence mode="sync">
    <motion.div key={step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} style={{ position: 'absolute', inset: 0, width: DESIGN_W, height: DESIGN_H }}>
     {scene}
    </motion.div>
   </AnimatePresence></LayoutGroup>
  </div>
 </div>
}
