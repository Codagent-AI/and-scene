import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

export function Stage<TPayload>({ step, index, mode, touchHandlers, showAttribution, layoutGroupId }: { step: Step<TPayload>; index: number; mode: PresentationMode; touchHandlers: React.HTMLAttributes<HTMLDivElement>; showAttribution: boolean; layoutGroupId: string }) {
  const scale = useFitScale(mode)
  const Scene = step.Scene
  const identity = step.groupKey ? `group:${step.groupKey}:${Scene.name}` : `step:${step.id}`
  return <div className="presentation-stage" data-presentation-stage style={{ position: 'relative', minHeight: 0, overflow: 'hidden' }} {...touchHandlers}>
    <div className="presentation-stage__viewport" data-presentation-stage-viewport style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <motion.div className="presentation-stage__canvas" data-presentation-canvas style={{ width: DESIGN_W, height: DESIGN_H, scale }}>
        <LayoutGroup id={layoutGroupId}>
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={identity} className="presentation-stage__scene" data-presentation-scene style={{ width: DESIGN_W, height: DESIGN_H }} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={LAYOUT_T}>
              <Scene payload={step.payload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
    {showAttribution && <span className="presentation-attribution" data-presentation-attribution style={{ position: 'fixed', right: 16, bottom: 12, zIndex: 5 }}>
      <a href="https://github.com/and-scene" target="_blank" rel="noreferrer">made by and-scene</a>
    </span>}
  </div>
}
