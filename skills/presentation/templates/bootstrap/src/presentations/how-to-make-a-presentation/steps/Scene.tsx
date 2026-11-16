import { AnimatePresence } from 'motion/react'
import { Box, Label, Arrow, Frame, SymbolChip, SceneLayer } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entitiesAt, entityId } from '../entities'
import type { SamplePayload } from './index'
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer className="sample-scene"><AnimatePresence>{entitiesAt(payload.beat).map(entity => {
    const Component = entity.kind === 'frame' ? Frame : entity.kind === 'arrow' || entity.kind === 'modify' ? Arrow : entity.kind === 'label' ? Label : entity.kind === 'chip' ? SymbolChip : Box
    return <Component key={entity.id} entityId={entityId(entity.id)} className={`entity entity-${entity.kind}`} data-sample-entity={entity.id}
      style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h, zIndex: entity.kind === 'frame' ? 0 : entity.kind === 'tray' ? 1 : 2 }}>
      {entity.kind === 'card' ? <><b>STEP {entity.label}</b><span>title</span><span>caption</span><span>visual</span></> : entity.kind === 'verify' ? <><b>✓ verify</b><span>build ✓</span><span>render ✓</span></> : <span>{entity.label}</span>}
    </Component>
  })}</AnimatePresence></SceneLayer>
}
