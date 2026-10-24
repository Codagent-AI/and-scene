import { useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import { sceneKey } from './steps'
import { StageContext } from './stageContext'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
}

/** Fixed design canvas scaled to fit; hosts the active step's scene and runs entity morphs. */
export function Stage<TPayload>({ steps, index, mode }: StageProps<TPayload>) {
  const region = useRef<HTMLDivElement>(null)
  const scale = useFitScale(region, mode)
  const step = steps[index]
  const [firstId] = useState(step.id)
  const [hasNavigated, setHasNavigated] = useState(false)
  // Latch during render so newcomers of the very first navigation already see it.
  if (!hasNavigated && step.id !== firstId) setHasNavigated(true)
  const { Scene } = step

  return (
    <div
      ref={region}
      data-presentation-stage-region
      style={{
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-presentation-stage
        style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, flex: 'none', position: 'relative' }}
      >
        <motion.div
          data-presentation-canvas
          data-presentation-scale={scale}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DESIGN_W,
            height: DESIGN_H,
            originX: 0,
            originY: 0,
            scale,
          }}
        >
          <StageContext.Provider value={{ hasNavigated }}>
            <LayoutGroup>
              <AnimatePresence initial={false}>
                <motion.div
                  key={sceneKey(step)}
                  data-presentation-scene
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: ENTER_T }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <Scene payload={step.payload} stepId={step.id} stepIndex={index} />
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>
          </StageContext.Provider>
        </motion.div>
      </div>
    </div>
  )
}
