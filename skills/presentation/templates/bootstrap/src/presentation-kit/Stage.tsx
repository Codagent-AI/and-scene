import { useMemo, useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { EASE, LAYOUT_T, STAGE_LAYOUT } from './constants'
import { useFitScale } from './useFitScale'
import type { CanvasSize, Mode, Step } from './types'

export interface StageProps<TPayload> {
  step: Step<TPayload>
  previous?: Step<TPayload>
  mode: Mode
  design?: Partial<CanvasSize>
}

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/** A stable number per Scene component, so a different Scene is a different scene instance. */
function sceneId(Scene: object): number {
  let id = sceneIds.get(Scene)
  if (id === undefined) {
    nextSceneId += 1
    id = nextSceneId
    sceneIds.set(Scene, id)
  }
  return id
}

/**
 * Mounts the active step's Scene on the fixed design canvas. Steps that share a
 * groupKey keep the same keyed element, so the scene instance persists and only
 * its payload changes. Ungrouped steps get their own key, so AnimatePresence
 * cross-fades them while shared layoutIds morph.
 */
export function Stage<TPayload>({ step, previous, mode, design }: StageProps<TPayload>) {
  const ref = useRef<HTMLDivElement>(null)
  const preset = STAGE_LAYOUT[mode]
  const width = design?.width ?? preset.width
  const height = design?.height ?? preset.height
  const geometry = useMemo(() => ({ ...preset, width, height }), [preset, width, height])
  const scale = useFitScale(ref, geometry)
  const { Scene } = step
  const sceneKey = `${step.groupKey ? `group:${step.groupKey}` : `step:${step.id}`}:scene${sceneId(Scene)}`

  return (
    <div
      ref={ref}
      data-presentation-stage
      style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}
    >
      <div
        data-presentation-canvas
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: geometry.width,
          height: geometry.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <LayoutGroup>
          <AnimatePresence>
            <motion.div
              key={sceneKey}
              data-presentation-scene
              style={{ position: 'absolute', inset: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: LAYOUT_T, ease: EASE }}
            >
              <Scene payload={step.payload} previous={previous?.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  )
}
