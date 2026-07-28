import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

export interface StageProps<TPayload> {
  steps: Step<TPayload>[]
  index: number
  mode: PresentationMode
}

/**
 * Fixed-design-canvas host for the active step's Scene. Wraps the canvas in
 * `LayoutGroup` + `AnimatePresence` so persisting `layoutId` entities morph
 * across steps and departing/entering scenes cross-fade at group boundaries.
 * Steps sharing a `groupKey` and `Scene` keep the same instance mounted —
 * only `payload` changes — so on-screen entities update in place instead of
 * remounting.
 */
export function Stage<TPayload>({ steps, index, mode }: StageProps<TPayload>) {
  const { containerRef, scale } = useFitScale(mode)
  const step = steps[index]
  const groupKey = step.groupKey ?? step.id
  const Scene = step.Scene

  return (
    <div className="sk-stage" data-scene-kit="stage" ref={containerRef}>
      <div
        className="sk-stage__canvas"
        data-scene-kit="stage-canvas"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          // The stage is a flex container, so without this the canvas shrinks
          // below DESIGN_W on narrow viewports while the absolutely positioned
          // scene keeps design coordinates — the fixed canvas would reflow and
          // clip, which is exactly what fit-scaling exists to prevent.
          flexShrink: 0,
          position: 'relative',
          transform: `scale(${scale})`,
        }}
      >
        <LayoutGroup>
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={groupKey}
              className="sk-stage__scene"
              data-scene-kit="stage-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T, ease: EASE }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload} active />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
