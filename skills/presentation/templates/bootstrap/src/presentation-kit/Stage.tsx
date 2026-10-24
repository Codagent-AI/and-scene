import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from './constants.ts'
import { useFitScale } from './useFitScale.ts'
import type { Mode, Step } from './types.ts'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
  designW?: number
  designH?: number
}

/**
 * Hosts the active step's Scene on a fixed design canvas scaled to fit.
 * Steps sharing a groupKey (and Scene) keep one instance: only the payload changes,
 * so continuing entities morph through layout projection instead of remounting.
 */
export function Stage<TPayload>({
  steps,
  index,
  mode,
  designW = DESIGN_W,
  designH = DESIGN_H,
}: StageProps<TPayload>) {
  const { areaRef, scale } = useFitScale(mode, designW, designH)
  const step = steps[index]
  const key = `${step.groupKey ?? step.id}`
  const { Scene } = step

  return (
    <div
      ref={areaRef}
      data-presentation-stage-area=""
      style={{ position: 'relative', flex: '1 1 0', minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-stage=""
        data-presentation-scale={scale.toFixed(3)}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: designW,
          height: designH,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.div
              key={key}
              data-presentation-scene=""
              data-presentation-group={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, position: 'absolute', inset: 0 }}
              transition={{ duration: ENTER_T, ease: EASE }}
              style={{ position: 'relative', width: designW, height: designH }}
            >
              <Scene payload={step.payload} step={step} index={index} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
