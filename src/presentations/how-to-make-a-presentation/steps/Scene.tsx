import { AnimatePresence } from 'motion/react'
import { Box, Arrow, Frame, Label, SymbolChip, Appear, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entitiesAt, entityId } from '../entities'
export function Scene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{entitiesAt(payload).map(e => {
    const Primitive = e.kind === 'reveal' ? Frame : ['connection', 'morph', 'modify'].includes(e.kind) ? Arrow : ['chip', 'depth', 'flag'].includes(e.kind) ? SymbolChip : e.kind === 'tray' ? Label : Box
    return <Appear key={e.id} style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h }}>
      <Primitive id={entityId(e.id)} data-entity={e.id} className={`entity entity-${e.kind}`} style={{ width: '100%', height: '100%' }}>
        {e.kind === 'modify' ? <><svg aria-hidden="true" viewBox="0 0 220 40"><defs><marker id="modify-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" /></marker></defs><path data-modify-path="" d="M10 0 C210 0 210 20 0 20" markerEnd="url(#modify-arrowhead)" /></svg><span>{e.text}</span></> : e.kind === 'reveal' ? <span>{e.text}</span> : e.kind === 'card' ? <><strong>{e.text}</strong><span>Title</span><span>Caption</span><span>Visual</span></> : e.kind === 'morph' ? <><span>→</span><small>{e.text}</small></> : e.kind === 'verify' ? <><strong aria-label={e.text}>✓</strong><span>verify</span><span>build</span><span>render</span></> : e.text}
      </Primitive>
    </Appear>
  })}</AnimatePresence></SceneLayer>
}
