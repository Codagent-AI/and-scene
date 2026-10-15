import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFitScale } from './useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, STAGE_LAYOUT } from './constants'
import { resolveGroup } from './navigation'
import type { PresentationMode, Step } from './types'

export function Stage<T>({ steps, index, mode }: { steps: readonly Step<T>[]; index: number; mode: PresentationMode }) {
  const scale = useFitScale(mode)
  const step = steps[index]
  if (!step) return null
  const group = resolveGroup(steps, index)
  const GroupScene = group?.scene === step.Scene ? step.Scene : null
  const SceneComponent = step.Scene
  const content = GroupScene
    ? <GroupScene payload={step.payload} step={step} index={index} total={steps.length} />
    : <AnimatePresence mode="sync" initial={false}><motion.div key={step.id} data-step-id={step.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY } }} exit={{ opacity: 0, transition: { duration: ENTER_T } }}><SceneComponent payload={step.payload} step={step} index={index} total={steps.length} /></motion.div></AnimatePresence>
  const geometry = STAGE_LAYOUT[mode]
  return <div data-presentation-stage style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', overflow: 'hidden', paddingTop: geometry.top, paddingBottom: geometry.bottom, boxSizing: 'border-box' }}><LayoutGroup key={mode} id={`presentation-${mode}`}><div style={{ width: DESIGN_W, height: DESIGN_H, position: 'relative', flex: 'none', transform: `scale(${scale})`, transformOrigin: 'center' }}>{content}</div></LayoutGroup></div>
}
