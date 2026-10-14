import { AnimatePresence, LayoutGroup } from 'motion/react'
import { DESIGN_H, DESIGN_W } from './constants'
import { hookAttrs, HOOK } from './hooks'
import { SceneLayer } from './nodes/SceneLayer'
import type { StageRect } from './geometry'
import type { Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  rect: StageRect
  scale: number
}

/** Shared-layout identity for a step: grouped steps keep one layer, others swap. */
function layerKey<TPayload>(step: Step<TPayload>): string {
  return step.groupKey === undefined ? `step:${step.id}` : `group:${step.groupKey}`
}

/**
 * Hosts the active step's scene on a fixed 880 x 380 canvas, scaled uniformly
 * into the stage region. The canvas is laid out at design size and transformed,
 * so entity geometry never reflows with the viewport.
 */
export function Stage<TPayload>({ step, rect, scale }: StageProps<TPayload>) {
  const Scene = step.scene
  return (
    <div
      {...hookAttrs(HOOK.stage)}
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        {...hookAttrs(HOOK.canvas)}
        style={{ position: 'relative', flex: 'none', width: DESIGN_W * scale, height: DESIGN_H * scale }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false}>
              <SceneLayer key={layerKey(step)}>
                <Scene payload={step.payload} />
              </SceneLayer>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
