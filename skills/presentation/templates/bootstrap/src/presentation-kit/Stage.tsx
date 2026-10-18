import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, type Mode } from './constants'
import { sceneKey } from './sceneKey'
import type { Step } from './types'

interface StageProps<TPayload> {
  steps: readonly Step<TPayload>[]
  index: number
  mode: Mode
  scale: number
  designWidth?: number
  designHeight?: number
}

const fill = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const

/**
 * Hosts the active step's Scene on the fixed design canvas. The canvas is scaled by one factor;
 * the whole stage is re-keyed when mode or scale changes so that change is a plain re-render and
 * never an entity layout morph.
 */
export function Stage<TPayload>({
  steps,
  index,
  mode,
  scale,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
}: StageProps<TPayload>) {
  const step = steps[index]
  if (!step) return null
  const { Scene } = step
  return (
    <div
      data-presentation-stage=""
      style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        key={`${mode}:${scale.toFixed(3)}`}
        data-presentation-canvas-frame=""
        data-presentation-scale={scale.toFixed(3)}
        style={{ position: 'relative', width: designWidth * scale, height: designHeight * scale }}
      >
        <div
          data-presentation-canvas=""
          data-presentation-canvas-width={designWidth}
          data-presentation-canvas-height={designHeight}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: designWidth,
            height: designHeight,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene=""
                style={fill}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T }}
              >
                <Scene payload={step.payload} step={step} index={index} count={steps.length} mode={mode} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
