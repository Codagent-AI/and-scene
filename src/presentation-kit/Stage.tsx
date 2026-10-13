import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { sceneHostKey } from './sceneHostKey'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
export function Stage<T>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: { steps: readonly Step<T>[]; index: number; mode: 'browse' | 'present'; width?: number; height?: number }) {
  const step = steps[index]
  const scale = useFitScale(width, height, mode)
  const PreviousScene = index > 0 ? steps[index - 1].Scene : undefined
  const grouped = Boolean(step.groupKey && PreviousScene === step.Scene && steps[index - 1]?.groupKey === step.groupKey)
  const Scene = step.Scene
  const sceneKey = sceneHostKey(steps, index)
  return <div className="presentation-stage-viewport" data-presentation-stage style={{ width: width * scale, height: height * scale }}><div className="presentation-stage-canvas" style={{ width, height, transform: `scale(${scale})` }}><LayoutGroup id="and-scene"><AnimatePresence mode="popLayout"><motion.div key={sceneKey} className="presentation-scene-host" data-presentation-scene data-presentation-group={step.groupKey} initial={grouped ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T }}><Scene payload={step.payload} /></motion.div></AnimatePresence></LayoutGroup></div></div>
}
