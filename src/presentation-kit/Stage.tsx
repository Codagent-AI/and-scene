import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

interface StageProps<TPayload> {
  current: Step<TPayload>
  stepIndex: number
  mode: PresentationMode
}

export function Stage<TPayload>({ current, stepIndex, mode }: StageProps<TPayload>) {
  const scale = useFitScale(mode)
  const grouped = Boolean(current.groupKey)
  const Scene = current.Scene

  const scene = <Scene payload={current.payload} step={current} stepIndex={stepIndex} />

  return (
    <div
      data-presentation-stage
      data-presentation-mode={mode}
      style={{ height: DESIGN_H * scale, width: DESIGN_W * scale }}
    >
      <div
        data-presentation-canvas
        style={{ height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_W }}
      >
        <LayoutGroup id="presentation-scene">
          {grouped ? (
            <div data-presentation-scene data-scene-group={current.groupKey}>{scene}</div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                data-presentation-scene
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T, ease: EASE }}
              >
                {scene}
              </motion.div>
            </AnimatePresence>
          )}
        </LayoutGroup>
      </div>
    </div>
  )
}
