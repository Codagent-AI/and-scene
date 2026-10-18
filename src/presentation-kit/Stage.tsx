import { useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T } from './constants'
import type { PresentationMode } from './constants'
import { StageContext } from './stageContext'
import { sceneKey } from './steps'
import type { Step } from './types'
import { useFitScale } from './useFitScale'

export interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: PresentationMode
}

/**
 * Fixed design canvas scaled to fit. The canvas is keyed by mode so a mode switch
 * re-renders at the new scale instead of morphing entities between scales.
 */
export function Stage<TPayload>({ steps, index, mode }: StageProps<TPayload>) {
  const viewport = useRef<HTMLDivElement>(null)
  const scale = useFitScale(viewport, mode)
  // `instant` holds from a mode switch until the next step change, so the remounted
  // canvas shows its entities in place instead of replaying their entrances.
  const [seen, setSeen] = useState({ mode, index, instant: false })
  if (seen.mode !== mode) setSeen({ mode, index, instant: true })
  else if (seen.index !== index) setSeen({ mode, index, instant: false })

  const step = steps[index]
  const { Scene } = step

  return (
    <div
      ref={viewport}
      data-presentation-stage=""
      style={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas=""
        data-presentation-scale={scale}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <StageContext.Provider value={{ instant: seen.instant }}>
          <LayoutGroup key={mode}>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: ENTER_T } }}
                exit={{ opacity: 0, transition: { duration: ENTER_T } }}
              >
                <Scene
                  payload={step.payload}
                  step={step}
                  stepIndex={index}
                  stepCount={steps.length}
                />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </StageContext.Provider>
      </div>
    </div>
  )
}
