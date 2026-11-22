import { AnimatePresence, motion } from 'motion/react'
import { UserRound, Sparkles } from 'lucide-react'
import type { SceneProps } from '../../../presentation-kit/types'
import { Appear } from '../../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Label } from '../../../presentation-kit/nodes/Label'
import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { entityId, entitiesForBeat } from '../entities'
export interface Beat { beat: number }
const primitives = { box: Box, label: Label, arrow: Arrow, frame: Frame }
export function SampleScene({ payload }: SceneProps<Beat>) {
  return <SceneLayer><AnimatePresence>{entitiesForBeat(payload.beat).map(entity => {
    const Node = primitives[entity.kind]
    return <Appear key={entity.name} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.width, height: entity.height, zIndex: entity.name === 'reveal' ? 0 : 1 }}>
      <Node id={entityId(entity.name)} data-entity-name={entity.name} className={`scene-node ${entity.tone ?? ''} ${entity.name === 'card-2' && payload.beat >= 8 ? 'refined' : ''}`} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }} Icon={entity.name === 'you' ? UserRound : entity.name === 'skill' ? Sparkles : undefined}>
        {entity.name === 'modify' ? <><svg width="114" height="103" viewBox="0 0 114 103" aria-hidden="true"><motion.path d="M 0 8 C 112 8 112 78 36 98" fill="none" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: .6, delay: .45 }} /><path d="m 43 89 -7 9 12 0" fill="none" stroke="currentColor" /></svg><small>{entity.detail}</small></> : <><span>{entity.text}</span>{entity.detail && <small>{entity.detail}</small>}</>}
      </Node>
    </Appear>
  })}</AnimatePresence></SceneLayer>
}
