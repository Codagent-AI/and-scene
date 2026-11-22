import { AnimatePresence, motion } from 'motion/react'
import { Box, Label, Frame, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entrance } from '../../../presentation-kit/nodes/Node'
import outline from '../outline.json'
import { diagram, entity } from '../entities'
export interface Payload { beat: number }
export function SampleScene({ payload: { beat } }: SceneProps<Payload>) {
  return <SceneLayer><AnimatePresence initial={false}>{diagram(beat).map(e => {
    const Component = e.kind === 'reveal' ? Frame : ['connector','link','modify'].includes(e.kind) ? Label : Box
    // A single keyed entity remains mounted as its payload changes. Only new IDs enter.
    return <Component key={e.id} id={entity(e.id)} {...entrance} className={`entity entity-${e.kind}`} data-kind={e.kind} data-edited={e.id === 'card-2' && beat >= 8 ? 'true' : undefined} style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h }}>
      <span>{e.text}</span>{e.detail && <small>{e.detail}</small>}
    </Component>
  })}</AnimatePresence>{beat >= 8 && <motion.svg className="modify-arc" width="880" height="380" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}><motion.path d="M 605 142 Q 605 173 386 174 L 386 190" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} /></motion.svg>}</SceneLayer>
}
export const STEPS: Step<Payload>[] = outline.map((meta, i) => ({ ...meta, groupKey: 'conversation', Scene: SampleScene, payload: { beat: i + 1 } }))
