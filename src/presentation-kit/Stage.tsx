import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, STAGE_LAYOUT } from './constants'
import { resolveGroup } from './navigation'
import type { PresentationMode, Step } from './types'

export function Stage<T>({ steps, index, mode }: { steps: readonly Step<T>[]; index: number; mode: PresentationMode }) {
  const { scale, overflowing } = useFitScale(mode)
  const step = steps[index]
  if (!step) return null
  const group = resolveGroup(steps, index)
  const GroupScene = group?.scene === step.Scene ? step.Scene : null
  const SceneComponent = step.Scene
  const content = GroupScene
    ? <GroupScene payload={step.payload} step={step} index={index} total={steps.length} />
    : <AnimatePresence mode="sync" initial={false}><motion.div key={step.id} data-step-id={step.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }} exit={{ opacity: 0, transition: { duration: ENTER_T } }}><SceneComponent payload={step.payload} step={step} index={index} total={steps.length} /></motion.div></AnimatePresence>
  const geometry = STAGE_LAYOUT[mode]
  return <div
    data-presentation-stage
    data-presentation-stage-overflowing={overflowing ? 'true' : undefined}
    aria-label={overflowing ? 'Diagram viewport. Scroll to view the entire diagram.' : 'Diagram viewport'}
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', minWidth: 0, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: overflowing ? 'start' : 'center', overflow: overflowing ? 'auto' : 'hidden', paddingTop: geometry.top, paddingBottom: geometry.bottom, boxSizing: 'border-box' }}
  >
    <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale, position: 'relative', flex: 'none' }}>
      <LayoutGroup key={mode} id={`presentation-${mode}`}>
        <div style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{content}</div>
      </LayoutGroup>
    </div>
  </div>
}
