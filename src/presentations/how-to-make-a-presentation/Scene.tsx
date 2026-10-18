import {
  Appear,
  Arrow,
  Box,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
  type Rect,
  type SceneProps,
} from '../../presentation-kit'
import {
  Check,
  FileText,
  Image,
  MessageCircle,
  Pencil,
  Plug,
  Shuffle,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { ARROWS, ENTITIES, FIRST_STEP, GEOMETRY, MORPH_CHIPS, type EntityId } from './entities'

export interface ScenePayload {
  /** 0-based index of the beat being shown. */
  stage: number
}

const EDITED_CARD: EntityId = 'step-card-2'

function rect(id: EntityId): Rect {
  return GEOMETRY[id as keyof typeof GEOMETRY]
}

function StepCard({ id, edited }: { id: EntityId; edited: boolean }) {
  return (
    <Box id={id} at={rect(id)} data-state={edited ? 'edited' : undefined}>
      <b>title</b>
      <span>caption</span>
      <span data-part="visual">
        <Image aria-hidden="true" /> visual
      </span>
    </Box>
  )
}

function arrow(id: EntityId) {
  return <Arrow id={id} {...ARROWS[id as keyof typeof ARROWS]} />
}

function chip(id: EntityId, text: string, Icon?: LucideIcon) {
  return (
    <SymbolChip id={id} at={rect(id)} Icon={Icon}>
      {text}
    </SymbolChip>
  )
}

const RENDER: Record<EntityId, (edited: boolean) => ReactNode> = {
  you: () => (
    <Box id="you" at={rect('you')} Icon={MessageCircle}>
      you
    </Box>
  ),
  prompt: () => (
    <Label id="prompt" at={rect('prompt')} Icon={FileText}>
      prompt
    </Label>
  ),
  skill: () => (
    <Box id="skill" at={rect('skill')} Icon={Plug}>
      skill
    </Box>
  ),
  'link-you-skill': () => arrow('link-you-skill'),
  'question-chip': () => chip('question-chip', 'question?', MessageCircle),
  tray: () => (
    <Box id="tray" at={rect('tray')}>
      route
    </Box>
  ),
  'step-card-1': (e) => <StepCard id="step-card-1" edited={e} />,
  'step-card-2': (e) => <StepCard id="step-card-2" edited={e} />,
  'step-card-3': (e) => <StepCard id="step-card-3" edited={e} />,
  'link-1-2': () => (
    <>
      {arrow('link-1-2')}
      <MorphChip link="link-1-2" />
    </>
  ),
  'link-2-3': () => (
    <>
      {arrow('link-2-3')}
      <MorphChip link="link-2-3" />
    </>
  ),
  'ghost-card': () => (
    <Box id="ghost-card" at={rect('ghost-card')}>
      unspecified
    </Box>
  ),
  'depth-control': () => chip('depth-control', 'partial ↔ full', SlidersHorizontal),
  'scene-kit': () => (
    <Box id="scene-kit" at={rect('scene-kit')} Icon={Plug}>
      scene kit
    </Box>
  ),
  verify: () => (
    <Box id="verify" at={rect('verify')} Icon={ShieldCheck}>
      <b>verify</b>
      <span>build</span>
      <span>render</span>
    </Box>
  ),
  'link-ghost-verify': () => arrow('link-ghost-verify'),
  'pass-check': () => (
    <span data-presentation-allow-overlap="">
      <SymbolChip id="pass-check" at={rect('pass-check')} Icon={Check} aria-label="pass" />
    </span>
  ),
  'modify-arc': () => arrow('modify-arc'),
  'modify-chip': () => chip('modify-chip', 'modify'),
  'edited-flag': () => chip('edited-flag', 'edited', Pencil),
  'reveal-frame': () => (
    <Frame id="reveal-frame" at={rect('reveal-frame')}>
      <Label id="reveal-label" at={{ x: 590, y: 340, w: 270, h: 30 }}>
        you&apos;re looking at one
      </Label>
    </Frame>
  ),
}

function MorphChip({ link }: { link: (typeof MORPH_CHIPS)[number]['id'] }) {
  const { x, y } = MORPH_CHIPS.find((m) => m.id === link)!
  return (
    <SymbolChip id={`morph-${link}`} at={{ x, y, w: 22, h: 22 }} Icon={Shuffle} aria-label="what morphs" />
  )
}

/**
 * One persistent scene: each beat only adds entities. Every entity keeps its keyed
 * `Appear` across later beats, so it stays put (no redraw, no refade) and only the
 * entities with a later FIRST_STEP enter.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const edited = payload.stage >= 7
  return (
    <SceneLayer>
      {ENTITIES.filter((id) => FIRST_STEP[id] <= payload.stage).map((id) => (
        <Appear key={id}>{RENDER[id](id === EDITED_CARD && edited)}</Appear>
      ))}
    </SceneLayer>
  )
}
