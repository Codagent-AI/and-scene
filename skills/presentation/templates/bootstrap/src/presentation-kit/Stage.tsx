import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EXIT_T, STAGE_LAYOUT } from './constants.ts'
import { sceneKey } from './sceneKey.ts'
import { LayoutDependencyContext } from './nodes/entity.ts'
import type { Mode, Step } from './types.ts'
import { useFitScale } from './useFitScale.ts'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  stepIndex: number
  mode: Mode
  showToc: boolean
}

/** Fixed design canvas, scaled uniformly to the space left by the chrome. */
export function Stage<TPayload>({ step, stepIndex, mode, showToc }: StageProps<TPayload>) {
  const scale = useFitScale(mode, showToc)
  const g = STAGE_LAYOUT[mode]
  const { Scene } = step
  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top: g.top,
        bottom: g.bottom,
        left: g.side + (showToc ? g.tocWidth : 0),
        right: g.side,
      }}
    >
      <motion.div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DESIGN_W,
          height: DESIGN_H,
          // Centred with margins, not a percentage translate: motion re-measures a scaled ancestor
          // that has one, which makes every persisting entity lurch on each step change.
          marginLeft: -DESIGN_W / 2,
          marginTop: -DESIGN_H / 2,
          scale,
        }}
      >
        <LayoutDependencyContext.Provider value={stepIndex}>
          <LayoutGroup>
            <AnimatePresence>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
                exit={{ opacity: 0, transition: { duration: EXIT_T } }}
              >
                <Scene payload={step.payload} stepIndex={stepIndex} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </LayoutDependencyContext.Provider>
      </motion.div>
    </div>
  )
}
