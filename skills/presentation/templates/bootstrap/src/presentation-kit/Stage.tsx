import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, STAGE_LAYOUT } from './constants'
import { sceneKey } from './steps'
import type { AnyStep, Mode } from './types'
import { useFitScale } from './useFitScale'

export interface StageProps {
  steps: readonly AnyStep[]
  index: number
  mode: Mode
  width?: number
  height?: number
}

/**
 * Fixed design canvas scaled uniformly to fit the gap between header and footer.
 * Steps sharing a groupKey keep one mounted Scene instance; otherwise the host
 * cross-fades and shared layoutIds morph.
 */
export function Stage({ steps, index, mode, width = DESIGN_W, height = DESIGN_H }: StageProps) {
  const scale = useFitScale(mode, width, height)
  const step = steps[index]
  const { top, bottom, side } = STAGE_LAYOUT[mode]
  const { Scene, payload } = step
  return (
    <div
      data-presentation-stage-area=""
      style={{
        position: 'absolute',
        left: side,
        right: side,
        top,
        bottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: width * scale, height: height * scale, position: 'relative', flex: 'none' }}>
        <div
          data-presentation-canvas=""
          data-presentation-scale={scale.toFixed(3)}
          style={{
            width,
            height,
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <motion.div
                key={sceneKey(step)}
                data-presentation-scene={sceneKey(step)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={ENTER_T}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Scene payload={payload} index={index} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
