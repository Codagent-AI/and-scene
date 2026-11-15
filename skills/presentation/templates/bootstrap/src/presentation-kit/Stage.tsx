import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W } from './constants'
import { sceneKey } from './sceneKey'
export function Stage<T>({ step, scale, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; scale: number; width?: number; height?: number }) {
  const id = useId()
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ width: width * scale, height: height * scale, position: 'relative' }}>
    <div data-presentation-canvas="" style={{ width, height, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup id={id}><AnimatePresence initial={false} mode="sync">
        <motion.div key={sceneKey(step)} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Scene payload={step.payload} />
        </motion.div>
      </AnimatePresence></LayoutGroup>
    </div>
  </div>
}
