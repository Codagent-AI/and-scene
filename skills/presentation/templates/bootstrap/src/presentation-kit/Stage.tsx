import type { ComponentType } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, EXIT_T, STAGE_LAYOUT } from './constants'
import { availableStage, useFitScale } from './useFitScale'
import { sceneKey } from './sceneKey'
import { useViewportSize } from './useViewportSize'
import type { PresentationMode, SceneProps, Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  mode: PresentationMode
}

export function Stage<TPayload>({ step, mode }: StageProps<TPayload>) {
  const scale = useFitScale(mode)
  const { width, height } = useViewportSize()
  const { header, footer } = STAGE_LAYOUT[mode]
  const Scene = step.Scene as ComponentType<SceneProps<TPayload>>

  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'absolute',
        top: header,
        bottom: footer,
        left: availableStage(width, height, mode).left,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Mode changes re-render the stage at the new fit rather than morphing. */}
      <LayoutGroup key={mode}>
        <div
          data-presentation-canvas=""
          data-presentation-scale={scale}
          style={{
            position: 'relative',
            flex: 'none',
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={sceneKey(step)}
              data-presentation-scene=""
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: EXIT_T, ease: EASE }}
            >
              <Scene payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  )
}
