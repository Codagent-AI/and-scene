import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useId, useState } from 'react'
import type { Step } from './types'
import { DESIGN_H, DESIGN_W } from './constants'
export function Stage<T>({ step, scale, width = DESIGN_W, height = DESIGN_H }: { step: Step<T>; scale: number; width?: number; height?: number }) {
  const namespace = useId()
  // A group alone is insufficient: a different component must get a new host.
  const [identity, setIdentity] = useState(() => ({ Scene: step.Scene, group: step.groupKey, id: step.id, version: 0 }))
  const old = identity
  const same = old.Scene === step.Scene && old.group === step.groupKey && (step.groupKey !== undefined || old.id === step.id)
  if (!same) setIdentity({ Scene: step.Scene, group: step.groupKey, id: step.id, version: old.version + 1 })
  const Scene = step.Scene
  return <div data-presentation-stage="" style={{ position: 'relative', width: width * scale, height: height * scale }}>
    <div data-presentation-canvas="" style={{ width, height, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <LayoutGroup id={namespace}>
        <AnimatePresence initial={false}>
          <motion.div key={identity.version} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Scene payload={step.payload} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  </div>
}
