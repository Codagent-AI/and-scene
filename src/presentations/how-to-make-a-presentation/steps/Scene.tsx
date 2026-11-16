import { AnimatePresence } from 'motion/react'
import { Box, Label, Arrow, Frame, SymbolChip, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entity, sceneState } from '../entities'
const components = { box: Box, label: Label, arrow: Arrow, frame: Frame, chip: SymbolChip }
export function StoryScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{sceneState(beat).map(item => {
    const Node = components[item.kind]
    return <Node key={item.id} entityId={entity(item.id)} data-role={item.role} data-edited={item.id === 'card-2' && beat >= 8 ? 'true' : undefined} style={{ position: 'absolute', left: item.x, top: item.y, width: item.width, height: item.height }}>
      {item.role === 'reveal' ? <span className="reveal-label">{item.text}</span> : <><span>{item.text}</span>{item.detail && <small>{item.detail}</small>}</>}
    </Node>
  })}</AnimatePresence>{beat >= 8 && <svg className="modify-arc" viewBox="0 0 880 380" aria-hidden="true"><path d="M 720 128 Q 720 182 310 182 L 310 190" /></svg>}</SceneLayer>
}
