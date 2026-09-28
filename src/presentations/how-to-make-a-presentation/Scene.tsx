import type { ReactNode } from 'react'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
  type SceneProps,
} from '../../presentation-kit'
import { ArrowLeftRight, CircleCheck, CircleHelp, Hammer, MonitorPlay, Pencil } from 'lucide-react'
import { E } from './entities'

export interface ScenePayload {
  /** Highest beat (1-9) drawn so far; every beat only adds to the ones before it. */
  beat: number
}

const CARDS = [
  { title: 'Title', caption: 'Caption', visual: 'Visual' },
  { title: 'Title', caption: 'Caption', visual: 'Visual' },
  { title: 'Title', caption: 'Caption', visual: 'Visual' },
  { title: 'Title', caption: 'Caption', visual: 'Visual' },
]

/** Positions a newcomer with a CSS slot; the entity inside carries the stable layoutId. */
function slot(key: string, name: string, node: ReactNode, delay = 0) {
  return (
    <Appear key={key} className={`hw-slot hw-slot-${name}`} delay={delay}>
      {node}
    </Appear>
  )
}

/**
 * The whole talk is one scene. Beats only add entities; a mounted entity is never
 * moved or redrawn, and an entity's Appear stays mounted so later beats do not replay it.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const { beat } = payload
  const items: ReactNode[] = []

  if (beat >= 9) {
    items.push(
      slot(
        E.frame,
        'frame',
        <Frame id={E.frame}>
          <Label id={E.frameLabel}>an example of the skill's own output</Label>
        </Frame>,
        0.2,
      ),
    )
  }
  if (beat >= 3) items.push(slot(E.tray, 'tray', <Box id={E.tray} />))

  if (beat >= 1) {
    items.push(
      slot(E.you, 'you', <Box id={E.you}><Label id={`${E.you}:label`}>you</Label></Box>),
      slot(E.prompt, 'prompt', <Box id={E.prompt}><Label id={`${E.prompt}:label`}>“a talk about…”</Label></Box>, 0.2),
    )
  }
  if (beat >= 2) {
    items.push(
      slot(E.skill, 'skill', <Box id={E.skill}><Label id={`${E.skill}:label`}>skill</Label></Box>),
      slot(E.talk, 'talk', <Arrow id={E.talk} direction="both" />, 0.2),
      slot(E.question, 'question', <SymbolChip id={E.question} Icon={CircleHelp} label="one question at a time" />, 0.4),
    )
  }

  const shown = beat >= 4 ? CARDS.length : beat >= 3 ? 1 : 0
  CARDS.slice(0, shown).forEach((card, i) => {
    const n = i + 1
    items.push(
      slot(
        E.card(n),
        `card-${n}`,
        <Box id={E.card(n)}>
          <Label id={`${E.card(n)}:title`}>{card.title}</Label>
          <Label id={`${E.card(n)}:caption`}>{card.caption}</Label>
          <Label id={`${E.card(n)}:visual`}>{card.visual}</Label>
        </Box>,
        i * 0.15,
      ),
    )
  })

  // What morphs is drawn on the link between consecutive cards, never inside a card.
  // Link 1 exists as soon as the first card lands; link n joins card n to card n+1 (link 4: the ghost).
  const linkCount = beat >= 5 ? 4 : beat >= 4 ? 3 : beat >= 3 ? 1 : 0
  for (let n = 1; n <= linkCount; n++) {
    items.push(
      slot(
        E.link(n),
        `link-${n}`,
        <Arrow id={E.link(n)} direction="right">
          <Label id={`${E.link(n)}:label`}>morphs</Label>
        </Arrow>,
        n * 0.15,
      ),
    )
  }

  if (beat >= 5) {
    items.push(
      slot(E.ghost, 'ghost', <Box id={E.ghost} data-presentation-ghost=""><Label id={`${E.ghost}:label`}>unspecified</Label></Box>),
      slot(E.depth, 'depth', <SymbolChip id={E.depth} Icon={ArrowLeftRight} label="partial ↔ full" />, 0.2),
    )
  }
  if (beat >= 6) {
    items.push(slot(E.socket, 'socket', <Box id={E.socket} Icon={Hammer}><Label id={`${E.socket}:label`}>scene kit: boxes, arrows, motion</Label></Box>))
  }
  if (beat >= 7) {
    items.push(
      slot(E.link(5), 'link-5', <Arrow id={E.link(5)} direction="right" />),
      slot(
        E.verify,
        'verify',
        <Box id={E.verify} Icon={MonitorPlay}>
          <Label id={`${E.verify}:label`}>verify</Label>
          <Label id={E.build}>build</Label>
          <Label id={E.render}>render</Label>
        </Box>,
        0.15,
      ),
      slot(E.pass, 'pass', <SymbolChip id={E.pass} Icon={CircleCheck} label="pass" />, 0.9),
    )
  }
  if (beat >= 8) {
    items.push(
      slot(E.modify, 'modify', <Emphasis id={E.modify} />),
      slot(E.modifyLabel, 'modify-label', <Label id={E.modifyLabel}>“change step 3”</Label>, 0.2),
      slot(E.edited, 'edited', <SymbolChip id={E.edited} Icon={Pencil} label="edited" />, 0.4),
    )
  }

  return <SceneLayer>{items}</SceneLayer>
}
