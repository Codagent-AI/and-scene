import { AnimatePresence } from 'motion/react'
import { Box, Arrow, Frame, Label, SymbolChip, Appear, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entitiesAt, entityId } from '../entities'
import type { Entity } from '../entities'
function MorphLink({ entity }: { entity: Entity }) {
  const { w, labelRect } = entity
  return <>
    <svg aria-hidden="true" viewBox={`0 0 ${w} 92`}>
      <path data-morph-link="" d={`M0 10 H${w} M${w / 2} 10 V90`} />
      <path d={`M${w - 6} 4 L${w} 10 L${w - 6} 16`} />
    </svg>
    {labelRect && <small style={{ left: labelRect.x - entity.x, top: labelRect.y - entity.y, width: labelRect.w, height: labelRect.h }}>{entity.text}</small>}
  </>
}
function PipelineLink() {
  return <svg aria-hidden="true" viewBox="0 0 25 24"><path d="M0 12 H25 M19 6 L25 12 L19 18" /></svg>
}
export function Scene({ payload }: SceneProps<number>) {
  return <SceneLayer><AnimatePresence>{entitiesAt(payload).map(e => {
    const Primitive = e.kind === 'reveal' ? Frame : ['connection', 'morph', 'modify'].includes(e.kind) ? Arrow : ['chip', 'depth', 'flag'].includes(e.kind) ? SymbolChip : e.kind === 'tray' ? Label : Box
    return <Appear key={e.id} style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h }}>
      <Primitive id={entityId(e.id)} aria-label={e.id === 'pipeline' ? 'Then verify' : undefined} data-entity={e.id} className={`entity entity-${e.kind}`} style={{ width: '100%', height: '100%' }}>
        {e.kind === 'modify' ? <><svg aria-hidden="true" viewBox="0 0 275 40"><defs><marker id="modify-arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" /></marker></defs><path data-modify-path="" d="M65 0 C270 0 270 14 0 14" markerEnd="url(#modify-arrowhead)" /></svg><span>{e.text}</span></> : e.kind === 'reveal' ? <span>{e.text}</span> : e.kind === 'card' ? <><strong>{e.text}</strong><span>Title</span><span>Caption</span><span>Visual</span></> : e.kind === 'morph' ? <MorphLink entity={e} /> : e.id === 'pipeline' ? <PipelineLink /> : e.kind === 'verify' ? <><strong aria-label={e.text}>✓</strong><span>verify</span><span>build</span><span>render</span></> : e.text}
      </Primitive>
    </Appear>
  })}</AnimatePresence></SceneLayer>
}
