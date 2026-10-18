import { Check, Eye, Hammer, MessageCircle, Pencil, Puzzle, ShieldCheck, SlidersHorizontal, User } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { E, RECT } from '../entities'

export interface SamplePayload {
  /** 1-based beat number; entities appear once their beat is reached. */
  beat: number
}

const CARDS = [
  { n: 1, title: 'title', caption: 'caption', visual: 'visual' },
  { n: 2, title: 'title', caption: 'caption', visual: 'visual' },
  { n: 3, title: 'title', caption: 'caption', visual: 'visual' },
  { n: 4, title: 'title', caption: 'caption', visual: 'visual' },
]

const focusRect = (beat: number) => {
  const pad = (r: { x: number; y: number; width: number; height: number }) => ({
    x: r.x - 8,
    y: r.y - 8,
    width: r.width + 16,
    height: r.height + 16,
  })
  switch (beat) {
    case 1:
      return pad(RECT.you)
    case 2:
      return pad(RECT.skill)
    case 3:
      return pad(RECT.card(1))
    case 4:
      return { x: 52, y: 186, width: 4 * 136 - 44 + 16, height: 112 }
    case 5:
      return pad(RECT.ghost)
    case 6:
      return pad(RECT.kit)
    case 7:
      return pad(RECT.verify)
    case 8:
      return pad(RECT.card(2))
    default:
      return null
  }
}

/** One scene for all nine beats: entities accumulate and keep their coordinates. */
export function SampleScene({ payload: { beat } }: SceneProps<SamplePayload>) {
  const delay = (d: number) => (beat === 1 ? 0 : d)
  const focus = focusRect(beat)
  const cards = CARDS.filter((c) => (c.n === 1 ? beat >= 3 : beat >= 4))
  return (
    <SceneLayer>
      <Box key="you" layoutId={E.you} {...RECT.you} Icon={User}>
        <span>you</span>
      </Box>
      <Appear key="prompt" delay={delay(0.7)}>
        <Box layoutId={E.prompt} x={40} y={100} width={120} height={36}>
          <span>prompt</span>
        </Box>
      </Appear>

      {beat >= 2 && (
        <Appear key="conversation">
          <Box layoutId={E.skill} {...RECT.skill} Icon={MessageCircle}>
            <span>skill</span>
          </Box>
          <Arrow id={E.talk} bidirectional from={{ x: 190, y: 56 }} to={{ x: 690, y: 56 }} />
          <SymbolChip layoutId={E.chip} x={394} y={20} width={100} height={28}>
            <span>question?</span>
          </SymbolChip>
        </Appear>
      )}

      {beat >= 3 && (
        <Appear key="tray">
          <Frame layoutId={E.tray} x={40} y={162} width={800} height={146} label="step cards" />
        </Appear>
      )}

      {cards.map((c) => (
        <Appear key={`card-${c.n}`} delay={c.n === 1 ? undefined : 0.7 + (c.n - 2) * 0.12}>
          <Box layoutId={E.card(c.n)} {...RECT.card(c.n)}>
            <span data-part="title">{c.title}</span>
            <span data-part="caption">{c.caption}</span>
            <span data-part="visual">{c.visual}</span>
          </Box>
          {c.n < 4 && (
            <Arrow
              id={E.link(c.n)}
              from={{ x: RECT.card(c.n).x + 92, y: 242 }}
              to={{ x: RECT.card(c.n).x + 136, y: 242 }}
            />
          )}
        </Appear>
      ))}
      {beat >= 3 && (
        <Appear key="morph">
          <SymbolChip layoutId={E.morph} x={154} y={212} width={40} height={20}>
            <span>morph</span>
          </SymbolChip>
        </Appear>
      )}

      {beat >= 5 && (
        <Appear key="depth">
          <Box layoutId={E.ghost} {...RECT.ghost} data-presentation-ghost="">
            <span>…</span>
          </Box>
          <SymbolChip layoutId={E.depth} x={176} y={100} width={160} height={36} Icon={SlidersHorizontal}>
            <span>partial ↔ full</span>
          </SymbolChip>
        </Appear>
      )}

      {beat >= 6 && (
        <Appear key="kit">
          <Box layoutId={E.kit} {...RECT.kit} Icon={Puzzle}>
            <span>scene kit</span>
          </Box>
        </Appear>
      )}

      {beat >= 7 && (
        <Appear key="verify">
          <Arrow id={E.verifyLink} from={{ x: 696, y: 242 }} to={{ x: 740, y: 242 }} />
          <Box layoutId={E.verify} {...RECT.verify} Icon={ShieldCheck}>
            <span>verify</span>
            <span data-part="caption">build · render</span>
          </Box>
          <SymbolChip layoutId={E.pass} x={766} y={264} width={40} height={22} Icon={Check} aria-label="pass" />
        </Appear>
      )}

      {beat >= 8 && (
        <Appear key="modify">
          <Box layoutId={E.route} x={60} y={334} width={200} height={36} Icon={Eye}>
            <span>/your-talk</span>
          </Box>
          <Arrow id={E.modifyDown} from={{ x: 20, y: 56 }} to={{ x: 20, y: 352 }} />
          <Arrow id={E.modifyIn} from={{ x: 20, y: 352 }} to={{ x: 60, y: 352 }} />
          <SymbolChip layoutId={E.edited} x={RECT.card(2).x + 40} y={180} width={64} height={22} Icon={Pencil}>
            <span>edited</span>
          </SymbolChip>
        </Appear>
      )}

      {focus && (
        <Emphasis
          key="focus"
          layoutId={E.focus}
          x={focus.x}
          y={focus.y}
          width={focus.width}
          height={focus.height}
          aria-hidden="true"
        />
      )}

      {beat >= 9 && (
        <Appear key="frame">
          <Frame layoutId={E.frame} x={6} y={4} width={868} height={372}>
            <Label x={580} y={346}>
              <Hammer data-presentation-icon="" aria-hidden="true" /> built by the skill
            </Label>
          </Frame>
        </Appear>
      )}
    </SceneLayer>
  )
}
