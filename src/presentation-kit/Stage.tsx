import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ENTER_T } from './constants.ts'
import type { DesignSize, Mode, Step } from './types.ts'
import { stageRegion, useFitScale } from './useFitScale.ts'

export interface StageProps<P> {
  steps: readonly Step<P>[]
  index: number
  mode: Mode
  design: DesignSize
  tocVisible: boolean
}

/**
 * Fixed design canvas scaled uniformly to fit. Steps sharing a `groupKey` keep one scene
 * instance; other steps cross-fade and shared `layoutId`s morph.
 */
export function Stage<P>({ steps, index, mode, design, tocVisible }: StageProps<P>) {
  const scale = useFitScale(mode, design, tocVisible)
  const region = stageRegion(mode, tocVisible)
  const step = steps[index]
  const { Scene } = step
  return (
    <div data-presentation-stage="" style={{ position: 'absolute', ...region, overflow: 'hidden' }}>
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale.toFixed(4)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: design.width,
          height: design.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Keyed by mode: a mode switch re-renders the scene instead of morphing it. */}
        <LayoutGroup key={mode}>
          <AnimatePresence initial={false}>
            <motion.div
              key={step.groupKey ?? step.id}
              data-presentation-step={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ENTER_T }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Scene payload={step.payload as P} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
