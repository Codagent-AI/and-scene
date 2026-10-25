import { AnimatePresence } from 'motion/react'
import { Box, Label, Arrow, Frame, SymbolChip, SceneLayer, Appear } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entityId, type Entity } from '../entities'
export function StoryScene({ payload }: SceneProps<readonly Entity[]>) {
  return <SceneLayer><AnimatePresence>{payload.map(entity => {
    const Primitive = entity.kind === 'reveal' ? Frame : ['connection', 'morph', 'modify'].includes(entity.kind) ? Arrow : ['prompt', 'tray', 'edited'].includes(entity.kind) ? Label : ['chip', 'depth'].includes(entity.kind) ? SymbolChip : Box
    return <Appear key={entity.name} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }}>
      <Primitive identity={entityId(entity.name)} className={`story-entity story-${entity.kind}`} data-story-name={entity.name} style={{ width: '100%', height: '100%' }}>
        <span>{entity.label}</span>{entity.detail && <small>{entity.detail}</small>}
      </Primitive>
    </Appear>
  })}</AnimatePresence></SceneLayer>
}
