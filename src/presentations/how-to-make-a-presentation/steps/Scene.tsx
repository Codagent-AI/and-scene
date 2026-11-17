import { AnimatePresence } from 'motion/react'
import { Box, Label, Arrow, Frame, SymbolChip, Appear, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entityId, visibleEntities } from '../entities'
export interface Beat { beat: number }
export function Scene({ payload }: SceneProps<Beat>) {
  return <SceneLayer><AnimatePresence>{visibleEntities(payload.beat).map(entity => {
    const Node = entity.id === 'reveal' ? Frame : entity.id.includes('link') || entity.id === 'conversation' || entity.id === 'modify' ? Arrow
      : ['question', 'depth', 'edited'].includes(entity.id) ? SymbolChip : entity.id === 'prompt' ? Label : Box
    return <Appear key={entity.id} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }}>
      <Node id={entityId(entity.id)} className={`entity entity-${entity.id}`} data-entity={entity.id} style={{ width: '100%', height: '100%' }}>
        {entity.id === 'modify' && <svg className="modify-arc" viewBox="0 0 198 90" aria-hidden="true" data-connection-from="skill" data-connection-to="card-3"><path d="M -16 30 C 250 12 250 78 -38 90 M -27 82 L -38 90 L -24 92" /></svg>}
        <span>{entity.label}</span>{'detail' in entity && <small>{entity.detail}</small>}
      </Node>
    </Appear>
  })}</AnimatePresence></SceneLayer>
}
