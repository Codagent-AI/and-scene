import { AnimatePresence, LayoutGroup } from 'motion/react'
import type { Step } from './types.js'
import { DESIGN_H, DESIGN_W } from './constants.js'
import { useFitScale } from './useFitScale.js'

export function Stage<TPayload>({ steps, index, mode, width = DESIGN_W, height = DESIGN_H, onTouchStart, onTouchEnd }: {
  steps: readonly Step<TPayload>[]; index: number; mode: 'browse' | 'present'; width?: number; height?: number
  onTouchStart?: React.TouchEventHandler<HTMLDivElement>; onTouchEnd?: React.TouchEventHandler<HTMLDivElement>
}) {
  const step = steps[index]
  const scale = useFitScale(mode, width, height)
  const key = step.groupKey ?? step.id
  const SceneComponent = step.scene
  return <div className="presentation-stage" data-presentation-stage="" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="presentation-stage-viewport" style={{ width: width * scale, height: height * scale }}>
      <div className="presentation-canvas" style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }} data-presentation-canvas="" data-design-width={width} data-design-height={height}>
        <LayoutGroup id="presentation-scene"><AnimatePresence mode="sync" initial={false}><div key={key} className="presentation-step-scene" data-presentation-step-scene={step.id}><SceneComponent payload={step.payload} step={step} index={index} /></div></AnimatePresence></LayoutGroup>
      </div>
    </div>
  </div>
}
