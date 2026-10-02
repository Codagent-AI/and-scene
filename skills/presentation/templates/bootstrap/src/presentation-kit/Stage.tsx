import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo } from 'react'
import type { Step } from './types'
import { useFitScale } from './useFitScale'
import type { PresentationMode } from './types'
import { DESIGN_H, DESIGN_W } from './constants'

interface StageProps<T> {
  steps: readonly Step<T>[]
  index: number
  mode: PresentationMode
  designWidth?: number
  designHeight?: number
  onTouchStart: React.TouchEventHandler<HTMLDivElement>
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>
}

export function Stage<T>({ steps, index, mode, designWidth = DESIGN_W, designHeight = DESIGN_H, onTouchStart, onTouchEnd }: StageProps<T>) {
  const step = steps[index]!
  const scale = useFitScale(designWidth, designHeight, mode)
  const groupStart = useMemo(() => {
    let start = index
    while (start > 0 && step.groupKey && steps[start - 1]?.groupKey === step.groupKey && steps[start - 1]?.Scene === step.Scene) start--
    return start
  }, [index, step, steps])
  const grouped = Boolean(step.groupKey)
  const Scene = step.Scene
  return (
    <div className="presentation-stage" data-presentation-stage="" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="presentation-stage-viewport" style={{ width: designWidth * scale, height: designHeight * scale }}>
        <LayoutGroup id={`presentation-${step.groupKey ?? step.id}`}>
          {grouped ? (
            <div key={groupStart} className="presentation-canvas" data-presentation-canvas="" style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }}>
              <Scene payload={step.payload} step={step} index={index} />
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step.id} className="presentation-canvas" data-presentation-canvas="" style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Scene payload={step.payload} step={step} index={index} />
              </motion.div>
            </AnimatePresence>
          )}
        </LayoutGroup>
      </div>
      <span className="presentation-stage-count" aria-hidden="true">{groupStart + 1}/{steps.length}</span>
    </div>
  )
}
