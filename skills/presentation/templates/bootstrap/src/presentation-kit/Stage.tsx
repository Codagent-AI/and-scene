import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import type { CSSProperties, RefObject } from 'react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from './constants'
import { useFitScale } from './useFitScale'
import type { PresentationMode, Step } from './types'

type StageProps<TPayload> = {
  activeStep: Step<TPayload>
  previousStep?: Step<TPayload>
  mode: PresentationMode
  container: RefObject<HTMLElement | null>
}

export function Stage<TPayload>({ activeStep, previousStep, mode, container }: StageProps<TPayload>) {
  const scale = useFitScale(container, mode)
  const isGroupedScene = activeStep.groupKey !== undefined &&
    (previousStep === undefined || previousStep.groupKey === activeStep.groupKey && previousStep.Scene === activeStep.Scene)
  const Scene = activeStep.Scene
  const canvasStyle: CSSProperties = {
    width: DESIGN_W,
    height: DESIGN_H,
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) scale(${scale})`,
    transformOrigin: 'center',
  }

  return (
    <div data-presentation-stage="true" data-presentation-mode={mode} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <LayoutGroup>
        {isGroupedScene ? (
          <div key={activeStep.groupKey} data-presentation-scene-group={activeStep.groupKey} style={canvasStyle}>
            <Scene payload={activeStep.payload} step={activeStep} />
          </div>
        ) : (
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={activeStep.id}
              data-presentation-scene={activeStep.id}
              style={canvasStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
            >
              <Scene payload={activeStep.payload} step={activeStep} />
            </motion.div>
          </AnimatePresence>
        )}
      </LayoutGroup>
    </div>
  )
}
