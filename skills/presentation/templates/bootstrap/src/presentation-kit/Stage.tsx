import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants.ts'
import type { Mode } from './constants.ts'
import { isWide } from './fit.ts'
import type { Step } from './types.ts'
import { useFitScale } from './useFitScale.ts'
import type { Canvas } from './useFitScale.ts'
import { sceneKey } from './sceneKey.ts'
import { useViewport } from './useViewport.ts'

export interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
  canvas?: Canvas
}

export function Stage<TPayload>({ steps, index, mode, canvas = { width: DESIGN_W, height: DESIGN_H } }: StageProps<TPayload>) {
  const scale = useFitScale(mode, canvas)
  const viewport = useViewport()
  const g = STAGE_LAYOUT[mode]
  const step = steps[index]
  const left = g.side + (isWide(viewport.width) ? g.tocWidth : 0)

  return (
    <div
      data-presentation-stage=""
      style={{
        position: 'fixed', left, right: g.side, top: g.top, bottom: g.bottom,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ width: canvas.width * scale, height: canvas.height * scale, position: 'relative', flex: 'none' }}>
        <div
          data-presentation-canvas=""
          data-presentation-scale={scale}
          style={{ position: 'absolute', left: 0, top: 0, width: canvas.width, height: canvas.height, transformOrigin: 'top left', transform: `scale(${scale})` }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T }}
                style={{ position: 'absolute', inset: 0 }}
                data-presentation-scene=""
              >
                <step.Scene payload={step.payload} step={step} index={index} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
