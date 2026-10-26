import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'
import type { Mode, Step } from './types'
import { DESIGN_W, DESIGN_H, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
export function Stage<T>({ step, mode, designW = DESIGN_W, designH = DESIGN_H }: { step: Step<T>; mode: Mode; designW?: number; designH?: number }) {
  const scale = useFitScale(mode, designW, designH)
  // Identity includes BOTH group and component. Adjacent shared scenes persist;
  // leaving a group or changing its renderer gives presence a new host.
  const [identity, setIdentity] = useState({ Scene: step.Scene, group: step.groupKey, id: step.id, serial: 0 })
  const old = identity
  if (old.Scene !== step.Scene || old.group !== step.groupKey || (!step.groupKey && old.id !== step.id)) {
    setIdentity({ Scene: step.Scene, group: step.groupKey, id: step.id, serial: old.serial + 1 })
  }
  const Scene = step.Scene
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage="" style={{ position: 'absolute', inset: `${geometry.top}px ${geometry.right}px ${geometry.bottom}px ${geometry.left}px`, display: 'grid', placeItems: 'center' }}>
    <div data-presentation-canvas="" style={{ position: 'relative', width: designW * scale, height: designH * scale }}>
      <LayoutGroup><div style={{ width: designW, height: designH, position: 'absolute', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AnimatePresence initial={false} mode="sync"><motion.div key={identity.serial} data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: LAYOUT_T }}><Scene payload={step.payload} /></motion.div></AnimatePresence>
      </div></LayoutGroup>
    </div>
  </div>
}
