import { AnimatePresence } from 'motion/react'
import { MessageCircle, Sparkles, UserRound } from 'lucide-react'
import { Appear, Box, Frame, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities, entityId, visibleEntities } from '../entities'
export function WorkshopScene({ payload: beat }: SceneProps<number>) {
  return <SceneLayer>{<AnimatePresence>{visibleEntities(beat).map(key => {
    const item = entities[key]
    const style = { position: 'absolute' as const, left: item.x, top: item.y, width: item.w, height: item.h }
    const content = <>{item.kind === 'person' && <UserRound size={20} />}{item.kind === 'skill' && <Sparkles size={20} />}{item.kind === 'prompt' && <MessageCircle size={14} />}<span>{item.label}</span>{item.kind === 'card' && <small>title · caption · visual</small>}{item.kind === 'link' && <small>morph</small>}{item.kind === 'verify' && <small>build ✓<br />render ✓</small>}{key === 'card2' && beat >= 8 && <em data-edited="true">edited</em>}</>
    return <Appear key={key} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {item.kind === 'reveal' ? <Frame id={entityId(key)} className="sample-entity reveal" style={style}>{content}</Frame> : <Box id={entityId(key)} className={`sample-entity ${item.kind}`} style={style} data-check-status={item.kind === 'verify' ? 'pass' : undefined}>{content}</Box>}
    </Appear>
  })}</AnimatePresence>}</SceneLayer>
}
