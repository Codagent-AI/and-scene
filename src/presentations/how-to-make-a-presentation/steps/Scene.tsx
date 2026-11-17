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
      <Node id={entityId(entity.id)} className={`entity entity-${entity.id}`} data-entity={entity.id} role={!entity.label && 'description' in entity ? 'img' : undefined} aria-label={'description' in entity ? entity.description : undefined} style={{ width: '100%', height: '100%' }}>
        {entity.id === 'conversation' && <svg className="conversation-link" viewBox="0 0 224 40" aria-hidden="true" data-connection-from="you" data-connection-to="skill"><path d="M 4 20 H 220 M 16 8 L 4 20 L 16 32 M 208 8 L 220 20 L 208 32" /></svg>}
        {entity.id === 'verify-link' && <svg className="conversation-link" viewBox="0 0 24 32" aria-hidden="true"><path d="M 1 16 H 23 M 15 8 L 23 16 L 15 24" /></svg>}
        {entity.id === 'modify' && <svg className="modify-arc" viewBox="0 0 182 104" aria-hidden="true" data-connection-from="skill" data-connection-to="card-3"><path d="M -18 36 C 238 10 238 92 -10 102 M 0 93 L -10 102 L 4 106" /></svg>}
        {entity.label && <span>{entity.label}{entity.id === 'verify' && <svg className="scene-symbol" viewBox="0 0 20 20" role="img" aria-label="verification passed" data-verification-pass=""><path d="M 3 10 L 8 15 L 17 4" /></svg>}{entity.id === 'edited' && <svg className="scene-symbol" viewBox="0 0 20 20" aria-hidden="true" data-edit-target="card-3"><path d="M 16 4 L 4 16 M 4 6 V 16 H 14" /></svg>}</span>}{'detail' in entity && entity.detail.map(line => <small key={line}>{line}</small>)}
      </Node>
    </Appear>
  })}</AnimatePresence></SceneLayer>
}
