import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { EXIT_T } from './constants'
import type { Mode, Step } from './types'
import { useFitScale } from './useFitScale'

interface StageProps<TPayload> {
  step: Step<TPayload>
  sceneKey: string
  mode: Mode
  width: number
  height: number
}

export function Stage<TPayload>({ step, sceneKey, mode, width, height }: StageProps<TPayload>) {
  const { area, scale } = useFitScale(width, height, mode)
  const { Scene, payload } = step
  return (
    <div ref={area} data-presentation-stage="" style={{ display: 'grid', placeItems: 'center', minWidth: 0, minHeight: 0, touchAction: 'pan-y' }}>
      <div style={{ position: 'relative', width: width * scale, height: height * scale }}>
        <div data-presentation-canvas="" style={{
          position: 'absolute', width, height, transformOrigin: 'top left', transform: `scale(${scale})`,
        }}>
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div key={sceneKey} data-presentation-scene=""
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: EXIT_T }}>
                <Scene payload={payload as TPayload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
