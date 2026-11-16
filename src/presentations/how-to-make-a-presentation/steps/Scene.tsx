import { AnimatePresence, motion } from 'motion/react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { visibleEntities } from '../entities'
const primitives = { box: Box, label: Label, arrow: Arrow, frame: Frame, chip: SymbolChip }
export function Scene({ payload }: SceneProps<{ beat: number }>) {
  return <SceneLayer className="sample-scene">
    <AnimatePresence>
      {visibleEntities(payload.beat).map(entity => {
        const Primitive = primitives[entity.kind]
        return <Appear key={entity.id} style={{ position: 'absolute', left: entity.x, top: entity.y, width: entity.w, height: entity.h }}>
          <Primitive id={`how-to:${entity.id}`} className={`entity entity-${entity.id}`} style={{ width: '100%', height: '100%' }}>
            {entity.text && <span>{entity.text}</span>}
            {entity.detail && <small>{entity.detail}</small>}
          </Primitive>
        </Appear>
      })}
      {payload.beat >= 8 && <motion.svg key="modify-arc" className="modify-arc" data-presentation-entity="how-to:modify-arc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} width="880" height="380" aria-label="Modify connects conversation to edited card">
        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55 }} d="M 670 119 C 670 181, 375 147, 375 177" />
      </motion.svg>}
    </AnimatePresence>
  </SceneLayer>
}
