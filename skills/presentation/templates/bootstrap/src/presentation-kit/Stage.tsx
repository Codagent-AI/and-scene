import { AnimatePresence, LayoutGroup } from 'motion/react'
import { DESIGN_H, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

export function Stage({ step, mode }: { step: Step; mode: Mode }) {
  const layout = STAGE_LAYOUT[mode]
  const scale = useFitScale(layout)
  const Scene = step.Scene

  return (
    <div
      className="absolute inset-x-0 flex items-center justify-center"
      style={{ top: layout.top, bottom: layout.bottom }}
    >
      <div
        className="relative shrink-0"
        style={{ width: layout.fitW, height: DESIGN_H, transform: `scale(${scale})` }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <Scene key={step.groupKey ?? step.id} step={step} />
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
