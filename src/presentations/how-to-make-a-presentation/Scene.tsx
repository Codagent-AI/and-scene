import {
  Check,
  FileText,
  Hammer,
  Image,
  MessagesSquare,
  Plug,
  Route,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit/index.ts'
import { ARROWS, CARD_SIZE, CARD_SLOTS, CARD_TOP, GHOST, ID, linkBetween, RECT, type Rect } from './entities.ts'
import type { SamplePayload } from './steps.ts'

const at = ({ left, top, width, height }: Rect) => ({ left, top, width, height })

function StepCard({ n, left, flagged }: { n: number; left: number; flagged: boolean }) {
  return (
    <Appear id={`${ID.card(n)}-appear`}>
      <Box
        id={ID.card(n)}
        kind="step-card"
        className="step-card"
        style={{ left, top: CARD_TOP, ...CARD_SIZE }}
      >
        <div data-flagged={flagged ? 'true' : undefined} className="step-card-body">
          <span className="step-card-title">
            <FileText aria-hidden="true" /> title
          </span>
          <span className="step-card-caption">caption</span>
          <span className="step-card-visual">
            <Image aria-hidden="true" /> visual
          </span>
        </div>
      </Box>
    </Appear>
  )
}

/** One persistent scene; each beat only reveals or flags more of the same entities. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const beat = payload.beat
  const cardCount = beat >= 4 ? CARD_SLOTS.length : beat >= 3 ? 1 : 0
  // the first card shows a link stub toward the next slot; later cards link to their successor
  const linkCount = cardCount === 1 ? 1 : Math.max(0, cardCount - 1)

  return (
    <SceneLayer className="htm-scene">
      <Appear when={beat >= 1} id={ID.you}>
        <Box id={ID.you} kind="you" icon={User} className="entity entity-you" style={at(RECT.you)}>
          you
        </Box>
        <Box id={ID.prompt} kind="prompt" className="entity entity-prompt" style={at(RECT.prompt)}>
          “a topic…”
        </Box>
      </Appear>

      <Appear when={beat >= 2} id={ID.skill}>
        <Box id={ID.skill} kind="skill" icon={Wand2} className="entity entity-skill" style={at(RECT.skill)}>
          skill
        </Box>
        <Box id={ID.question} kind="question" icon={MessagesSquare} className="entity entity-question" style={at(RECT.question)}>
          which topic?
        </Box>
      </Appear>
      <Arrow id={ID.talk} when={beat >= 2} bidirectional className="arrow arrow-talk" {...ARROWS.talk} />

      <Appear when={beat >= 3} id={ID.tray}>
        <Box id={ID.tray} kind="tray" className="entity entity-tray" style={at(RECT.tray)} />
        <Box id={ID.route} kind="route" icon={Route} className="entity entity-route" style={at(RECT.route)}>
          route
        </Box>
      </Appear>
      {CARD_SLOTS.slice(0, cardCount).map((left, i) => (
        <StepCard key={left} n={i + 1} left={left} flagged={beat >= 8 && i === 1} />
      ))}
      {CARD_SLOTS.slice(0, linkCount).map((left, i) => {
        const link = linkBetween(left + CARD_SIZE.width, CARD_SLOTS[i + 1])
        return (
          <div key={left}>
            <Arrow id={ID.link(i + 1)} className="arrow arrow-link" {...link} />
            <Appear id={`${ID.link(i + 1)}-morph`}>
              <SymbolChip
                id={`${ID.link(i + 1)}-chip`}
                icon={Shuffle}
                className="entity entity-morph"
                style={{ left: link.from.x + 6, top: CARD_TOP + 18, width: 24, height: 24 }}
              />
            </Appear>
          </div>
        )
      })}

      <Appear when={beat >= 5} id={ID.ghost}>
        <Box id={ID.ghost} kind="ghost-card" className="entity entity-ghost" style={at({ ...GHOST })}>
          not specified yet
        </Box>
        <Box id={ID.depth} kind="depth-control" icon={SlidersHorizontal} className="entity entity-depth" style={at(RECT.depth)}>
          partial ↔ full
        </Box>
      </Appear>

      <Appear when={beat >= 6} id={ID.kit}>
        <Box id={ID.kit} kind="scene-kit" icon={Plug} className="entity entity-kit" style={at(RECT.kit)}>
          scene kit: boxes, arrows, motion
        </Box>
      </Appear>

      <Arrow id={ID.verifyLink} when={beat >= 7} className="arrow arrow-link" {...linkBetween(GHOST.left + GHOST.width, RECT.verify.left)} />
      <Appear when={beat >= 7} id={ID.verify}>
        <Box id={ID.verify} kind="verify" icon={Hammer} className="entity entity-verify" style={at(RECT.verify)}>
          <span>verify</span>
          <span className="verify-checks">build · render</span>
        </Box>
      </Appear>
      <Appear when={beat >= 7} id={ID.pass}>
        <SymbolChip id={ID.pass} kind="pass" icon={Check} className="entity entity-pass" style={at(RECT.pass)} />
      </Appear>

      <Arrow id={ID.modify} when={beat >= 8} className="arrow arrow-modify" {...ARROWS.modify} />
      <Appear when={beat >= 8} id={ID.modifyLabel}>
        <Label id={ID.modifyLabel} className="entity entity-modify-label" style={at(RECT.modifyLabel)}>
          modify
        </Label>
        <SymbolChip id={ID.edited} kind="edited-flag" icon={Sparkles} className="entity entity-edited" style={at(RECT.edited)}>
          edited
        </SymbolChip>
      </Appear>

      <Appear when={beat >= 9} id={ID.frame}>
        <Frame id={ID.frame} className="entity entity-frame" style={at(RECT.frame)} />
        <Label id={ID.frameLabel} className="entity entity-frame-label" style={at(RECT.frameLabel)}>
          made with this skill — you’re looking at its output
        </Label>
      </Appear>
    </SceneLayer>
  )
}
