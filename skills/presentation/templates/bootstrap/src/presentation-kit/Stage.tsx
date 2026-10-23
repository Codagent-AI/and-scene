import { useRef } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_T, EASE } from './constants'
import { layerStyle, stageStyle } from './layout'
import { useFitScale } from './useFitScale'
import type { Mode, Step } from './types'

const sceneIds = new WeakMap<object, number>()
let nextSceneId = 0

/** Presence key: a new group or a new scene component both count as a new scene. */
function sceneKey(groupKey: string, scene: object): string {
  let id = sceneIds.get(scene)
  if (id === undefined) {
    id = nextSceneId
    nextSceneId += 1
    sceneIds.set(scene, id)
  }
  return `${groupKey}#${id}`
}

export interface StageProps<P> {
  steps: readonly Step<P>[]
  index: number
  mode: Mode
  designWidth?: number
  designHeight?: number
}

/**
 * Hosts the active step's scene on a fixed design canvas scaled uniformly to the
 * stage. Steps sharing a groupKey keep one scene instance; a new group cross-fades.
 */
export function Stage<P>({ steps, index, mode, designWidth = DESIGN_W, designHeight = DESIGN_H }: StageProps<P>) {
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref, mode, designWidth, designHeight)
  const step = steps[index]
  if (!step) return null
  const Scene = step.scene
  return (
    <div ref={ref} data-presentation-stage="" style={stageStyle}>
      <div style={{ position: 'relative', width: designWidth * scale, height: designHeight * scale }}>
        <div
          data-presentation-canvas=""
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
                key={sceneKey(step.groupKey, step.scene)}
                data-presentation-scene={step.groupKey}
                style={layerStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ENTER_T, ease: EASE }}
              >
                <Scene payload={step.payload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  )
}
