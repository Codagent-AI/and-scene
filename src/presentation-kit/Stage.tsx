import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useState, type ComponentType } from 'react'
import { sceneKey } from './sceneKey.ts'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants.ts'
import { reservedSide, useFitScale, useViewport } from './useFitScale.ts'
import type { DesignSize, Mode, SceneProps, Step, StepMeta } from './types.ts'

const DEFAULT_DESIGN: DesignSize = { width: DESIGN_W, height: DESIGN_H }

interface StageProps<P> {
  step: Step<P>
  meta: StepMeta
  mode: Mode
  design?: DesignSize
}

/** Fixed design canvas scaled to fit, hosting the active step's scene. */
export function Stage<P>({ step, meta, mode, design = DEFAULT_DESIGN }: StageProps<P>) {
  const scale = useFitScale(mode, design)
  const { width: viewportWidth } = useViewport()
  const { top, bottom } = STAGE_LAYOUT[mode]
  const Scene = step.Scene as ComponentType<SceneProps<P>>
  const key = sceneKey(step)
  // Remember the step shown before this one while the same scene instance continues.
  const [track, setTrack] = useState({ id: step.id, key, payload: step.payload, previous: undefined as P | undefined })
  if (track.id !== step.id) {
    setTrack({ id: step.id, key, payload: step.payload, previous: track.key === key ? track.payload : undefined })
  }
  const previous = track.id === step.id ? track.previous : track.key === key ? track.payload : undefined
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top,
        bottom,
        left: reservedSide(mode, viewportWidth),
        right: 0,
        overflow: 'hidden',
      }}
    >
      <motion.div
        data-presentation-canvas=""
        layoutRoot
        style={{
          position: 'absolute',
          // Centre with calc() offsets: a percentage `x`/`y` translate here makes layout
          // projection mis-measure every morph inside the scaled canvas.
          left: `calc(50% - ${design.width / 2}px)`,
          top: `calc(50% - ${design.height / 2}px)`,
          width: design.width,
          height: design.height,
          scale,
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={key}
              data-presentation-scene=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
            >
              <Scene payload={step.payload} previous={previous} step={meta} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  )
}
