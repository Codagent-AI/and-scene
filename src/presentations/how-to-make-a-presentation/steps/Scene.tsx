import { AnimatePresence } from 'motion/react'
import { Box, Label, Arrow, Frame, SymbolChip, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entitiesAt } from '../entities'
const nodes = { box: Box, label: Label, arrow: Arrow, frame: Frame, chip: SymbolChip }
export function StoryScene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{entitiesAt(payload).map(entity => {
    const Component = nodes[entity.kind]
    return <Component key={entity.id} id={entity.id} className={entity.treatment} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }} {...(entity.kind === 'arrow' ? { bidirectional: entity.bidirectional, path: entity.path } : {})}>
      {entity.text && <span>{entity.text}</span>}{entity.parts && <small>{entity.parts.map(part => <span key={part}>{part}</span>)}</small>}
    </Component>
  })}</AnimatePresence></SceneLayer>
}
