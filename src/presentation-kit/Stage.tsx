import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W } from './constants'
import type { PresentationMode, SceneProps, Step } from './types'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: PresentationMode
  className?: string
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
}

export function Stage<TPayload>({ steps, index, mode, className, onTouchStart, onTouchEnd }: StageProps<TPayload>) {
  const scale = useFitScale(mode)
  const step = steps[index]
  const Scene = step.Scene
  const props: SceneProps<TPayload> = { payload: step.payload, step, index, total: steps.length }
  const key = step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`
  return <div className={['presentation-stage', className].filter(Boolean).join(' ')} data-presentation-stage="" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="presentation-stage__viewport" data-presentation-stage-viewport="">
      <motion.div className="presentation-stage__canvas" data-presentation-canvas="" style={{ width: DESIGN_W, height: DESIGN_H, scale, position: 'relative' }}>
        <LayoutGroup id="presentation-scene">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={key} className="presentation-scene" data-presentation-scene="" style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Scene {...props} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </div>
  </div>
}
