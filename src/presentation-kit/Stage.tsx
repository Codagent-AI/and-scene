import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'
import { DESIGN_H, DESIGN_W } from './constants'

export function Stage<T>({ step, index, total, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: {
  step: Step<T>; index: number; total: number; mode: PresentationMode; designWidth?: number; designHeight?: number
}) {
  const scale = useFitScale(mode, designWidth, designHeight)
  const group = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  const canvasStyle: CSSProperties = { width: designWidth, height: designHeight, transform: `translate(-50%, -50%) scale(${scale})` }
  const Scene = step.scene
  return <div className="presentation-stage" data-presentation-stage data-presentation-mode={mode}>
    <div className="presentation-stage__canvas" style={canvasStyle} data-presentation-canvas data-design-width={designWidth} data-design-height={designHeight}>
      <LayoutGroup id={`presentation-${step.groupKey ?? step.id}`}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div className="presentation-scene" key={group} data-presentation-scene={step.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
            <Scene payload={step.payload} step={step} index={index} total={total} />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </div>
    {step.overlay && <div className="presentation-overlay" data-presentation-overlay>{step.overlay}</div>}
  </div>
}
