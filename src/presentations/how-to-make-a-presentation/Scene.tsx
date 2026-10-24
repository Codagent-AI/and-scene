import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { AnimatePresence, motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, ENTER_DELAY, ENTER_T, EXIT_T } from '../../presentation-kit'
import { ENTITIES, LINKS, MODIFY_ARC, type EntityDef } from './entities'

export interface SamplePayload {
  /** 1-based beat this step shows. */
  beat: number
}

const own = (tone?: string) => (tone ? `sample-${tone}` : undefined)

function Entity({ def, fresh }: { def: EntityDef; fresh: boolean }) {
  const { id, x, y, w, h, text, icon, tone } = def
  const common = { id, x, y, w, h, className: own(tone) }
  let node
  switch (def.kind) {
    case 'box':
      node = <Box {...common} icon={icon}>{text}</Box>
      break
    case 'label':
      node = <Label {...common}>{text}</Label>
      break
    case 'chip':
      node = <SymbolChip {...common} symbol={text} icon={icon} />
      break
    case 'frame':
      node = <Frame {...common} />
      break
    case 'emphasis':
      node = <Emphasis {...common} />
      break
  }
  return <Appear active={fresh}>{node}</Appear>
}

/** Raw motion element: coordinate-heavy shapes can bypass the primitives and keep a stable `layoutId`. */
function ModifyArc({ fresh }: { fresh: boolean }) {
  return (
    <motion.svg
      layoutId={MODIFY_ARC.id}
      data-presentation-node="arc"
      data-presentation-entity={MODIFY_ARC.id}
      width={DESIGN_W}
      height={DESIGN_H}
      className="sample-arc"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
      initial={fresh ? { opacity: 0 } : undefined}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: EXIT_T, ease: EASE } }}
    >
      <path d={MODIFY_ARC.d} />
    </motion.svg>
  )
}

/**
 * One persistent scene for the whole presentation. Entities born at the active
 * beat are newcomers (`Appear`); everything already on screen renders
 * identically each beat so it keeps its place.
 */
export function SampleScene({ payload: { beat } }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer className="sample-scene">
      <AnimatePresence>
        {LINKS.filter((l) => l.beat <= beat).map((l) => (
          <Appear key={l.id} active={l.beat === beat}>
            <Arrow id={l.id} from={l.from} to={l.to} bidirectional={l.bidirectional} className={own(l.tone)} />
          </Appear>
        ))}
        {ENTITIES.filter((e) => e.beat <= beat).map((def) => (
          <Entity key={def.id} def={def} fresh={def.beat === beat} />
        ))}
        {beat >= MODIFY_ARC.beat && <ModifyArc key={MODIFY_ARC.id} fresh={beat === MODIFY_ARC.beat} />}
      </AnimatePresence>
    </SceneLayer>
  )
}
