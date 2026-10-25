import { Check, MessageCircle, Route, Shuffle, ToggleLeft, Wrench } from 'lucide-react'
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
} from '../../../presentation-kit/index.ts'
import { E } from '../entities.ts'

export interface SamplePayload {
  /** 1-based count of beats revealed so far; entities accumulate with it. */
  stage: number
}

const CARD_W = 120
const CARD_H = 96
const CARD_Y = 198
const GAP = 44
const slotX = (n: number) => 40 + (n - 1) * (CARD_W + GAP)

function StepCard({ n }: { n: number }) {
  return (
    <Box id={E.card(n)} at={{ x: slotX(n), y: CARD_Y, w: CARD_W, h: CARD_H }} variant="step-card">
      <strong>step {n}</strong>
      <span>title</span>
      <span>caption</span>
      <span>visual</span>
    </Box>
  )
}

function Link({ n }: { n: number }) {
  const x = slotX(n) + CARD_W
  return (
    <>
      <Arrow id={E.link(n)} from={[x, CARD_Y + 52]} to={[x + GAP, CARD_Y + 52]} dashed variant="morph-link" />
      <SymbolChip id={E.morph(n)} at={{ x: x + 10, y: CARD_Y + 16, w: 24, h: 24 }} Icon={Shuffle} variant="morph" />
    </>
  )
}

/** One persistent scene; `stage` decides which accumulated entities are on screen. */
export function SampleScene({ payload: { stage } }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer>
      <Appear when={stage >= 9}>
        <Frame id={E.reveal} at={{ x: 8, y: 4, w: 864, h: 372 }} variant="reveal" />
        <Label id={E.revealLabel} at={{ x: 24, y: 348, w: 300, h: 22 }} variant="reveal-label">
          this presentation, drawn by the skill
        </Label>
      </Appear>

      <Box id={E.you} at={{ x: 40, y: 16, w: 140, h: 64 }} variant="actor" Icon={MessageCircle}>
        <strong>you</strong>
      </Box>
      <Appear when={stage >= 1}>
        <Box id={E.prompt} at={{ x: 40, y: 92, w: 140, h: 36 }} variant="prompt">
          a topic
        </Box>
      </Appear>

      <Appear when={stage >= 2}>
        <Box id={E.skill} at={{ x: 700, y: 16, w: 140, h: 64 }} variant="actor">
          <strong>skill</strong>
        </Box>
        <Arrow id={E.talk} from={[184, 48]} to={[696, 48]} both variant="conversation" />
        <SymbolChip id={E.question} at={{ x: 380, y: 12, w: 120, h: 24 }} variant="question">
          what&apos;s the topic?
        </SymbolChip>
      </Appear>

      <Appear when={stage >= 3}>
        <Frame id={E.tray} at={{ x: 24, y: 172, w: 816, h: 158 }} variant="tray" />
        <Label id={E.trayLabel} at={{ x: 36, y: 176, w: 120, h: 16 }} variant="tray-label">
          your steps
        </Label>
        <StepCard n={1} />
        <Link n={1} />
      </Appear>

      <Appear when={stage >= 4}>
        <StepCard n={2} />
        <StepCard n={3} />
        <Link n={2} />
      </Appear>

      <Appear when={stage >= 5}>
        <Box id={E.ghost} at={{ x: slotX(5), y: CARD_Y, w: CARD_W, h: CARD_H }} variant="ghost-card">
          <span>not yet specified</span>
        </Box>
        <SymbolChip id={E.depth} at={{ x: 40, y: 134, w: 140, h: 28 }} Icon={ToggleLeft} variant="control">
          partial / full
        </SymbolChip>
      </Appear>

      <Appear when={stage >= 6}>
        <Box id={E.socket} at={{ x: 340, y: 330, w: 180, h: 30 }} Icon={Wrench} variant="socket">
          scene kit
        </Box>
      </Appear>

      <Appear when={stage >= 7}>
        <Arrow id={E.verifyChain} from={[slotX(3) + CARD_W, CARD_Y + 48]} to={[slotX(4), CARD_Y + 48]} variant="chain" />
        <Box id={E.verify} at={{ x: slotX(4), y: CARD_Y, w: CARD_W, h: CARD_H }} variant="verify">
          <strong>verify</strong>
          <span>build · render</span>
        </Box>
      </Appear>
      <Appear when={stage >= 7} delay={0.5}>
        <SymbolChip id={E.pass} at={{ x: slotX(4) + 48, y: CARD_Y + 62, w: 24, h: 24 }} Icon={Check} variant="pass" />
      </Appear>

      <Appear when={stage >= 8}>
        <Box id={E.route} at={{ x: 700, y: 334, w: 116, h: 26 }} Icon={Route} variant="route">
          route
        </Box>
        <Arrow
          id={E.modify}
          from={[842, 48]}
          via={[[878, 48], [878, 347]]}
          to={[818, 347]}
          variant="modify"
        />
        <Emphasis id={E.edited} at={{ x: slotX(2) - 6, y: CARD_Y - 6, w: CARD_W + 12, h: CARD_H + 12 }} variant="edited">
          <span data-presentation-flag="">edited</span>
        </Emphasis>
      </Appear>
    </SceneLayer>
  )
}
