import type { ReactNode } from 'react'
import { Check, Image, Pencil, SlidersHorizontal, User, Wand2 } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit/index.ts'
import { E, G } from './entities.ts'

export interface HowToPayload {
  /** 1-based beat; the scene shows every entity introduced at or before it. */
  beat: number
}

const CARD_PARTS = (n: number) => (
  <>
    <span data-part="index">step {n}</span>
    <span data-part="title">title</span>
    <span data-part="caption">caption</span>
    <span data-part="visual"><Image data-presentation-icon="" aria-hidden="true" /> visual</span>
  </>
)

/** Entities grouped by the beat that introduces them; each group fades in once, then persists. */
function groups(): Array<{ beat: number; key: string; node: ReactNode }> {
  const [c1, c2, c3] = G.cards
  return [
    {
      beat: 1,
      key: 'ask',
      node: (
        <>
          <Box id={E.you} at={G.you} Icon={User} data-role="you">you</Box>
          <Box id={E.prompt} at={G.prompt} data-role="prompt">“I have a topic…”</Box>
        </>
      ),
    },
    {
      beat: 2,
      key: 'interview',
      node: (
        <>
          <Box id={E.skill} at={G.skill} Icon={Wand2} data-role="skill">skill</Box>
          <Arrow id={E.conversation} {...G.conversation} bidirectional />
          <SymbolChip id={E.question} at={G.question} data-role="question">one question…</SymbolChip>
        </>
      ),
    },
    {
      beat: 3,
      key: 'first-card',
      node: (
        <>
          <Label id={E.trayLabel} at={G.trayLabel} data-role="tray">step tray</Label>
          <Box id={E.card1} at={c1} data-role="card">{CARD_PARTS(1)}</Box>
          <Arrow id={E.link1} {...G.links[0]} />
          <Label id={E.link1Label} at={G.links[0].label} data-role="link-label">morphs</Label>
        </>
      ),
    },
    {
      beat: 4,
      key: 'more-cards',
      node: (
        <>
          <Box id={E.card2} at={c2} data-role="card">{CARD_PARTS(2)}</Box>
          <Box id={E.card3} at={c3} data-role="card">{CARD_PARTS(3)}</Box>
          <Arrow id={E.link2} {...G.links[1]} />
          <Label id={E.link2Label} at={G.links[1].label} data-role="link-label">moves</Label>
        </>
      ),
    },
    {
      beat: 5,
      key: 'depth',
      node: (
        <>
          <Box id={E.ghost} at={G.ghost} data-role="ghost">
            <span data-part="index">step 4</span>
            <span data-part="title">not yet specified</span>
          </Box>
          <Arrow id={E.link3} {...G.links[2]} dashed />
          <Label id={E.link3Label} at={G.links[2].label} data-role="link-label">re-labels</Label>
          <SymbolChip id={E.depth} at={G.depth} Icon={SlidersHorizontal} data-role="depth">partial ↔ full</SymbolChip>
        </>
      ),
    },
    {
      beat: 6,
      key: 'kit',
      node: (
        <>
          <Box id={E.socket} at={G.socket} data-role="socket">scene kit: boxes, arrows, motion</Box>
          <Arrow id={E.plug} {...G.plug} />
        </>
      ),
    },
    {
      beat: 7,
      key: 'verify',
      node: (
        <>
          <Arrow id={E.link4} {...G.verifyLink} />
          <Box id={E.verify} at={G.verify} data-role="verify">verify</Box>
          <SymbolChip id={E.verifyBuild} at={G.verifyBuild} data-role="check">build</SymbolChip>
          <SymbolChip id={E.verifyRender} at={G.verifyRender} data-role="check">render</SymbolChip>
          <SymbolChip id={E.verifyPass} at={G.verifyPass} Icon={Check} state="pass" data-role="pass">all green</SymbolChip>
        </>
      ),
    },
    {
      beat: 8,
      key: 'modify',
      node: (
        <>
          <Arrow id={E.modify} {...G.modify} />
          <Label id={E.modifyLabel} at={G.modifyLabel} data-role="link-label">modify</Label>
          <Emphasis id={E.edited} at={G.edited} />
          <SymbolChip id={E.editedFlag} at={G.editedFlag} Icon={Pencil} data-role="flag">edited</SymbolChip>
        </>
      ),
    },
    {
      beat: 9,
      key: 'reveal',
      node: (
        <>
          <Frame id={E.frame} at={G.frame} />
          <Label id={E.frameLabel} at={G.frameLabel} data-role="frame-label">you’re looking at one</Label>
        </>
      ),
    },
  ]
}

/** The single evolving scene: one persistent instance, entities accumulate per beat. */
export function HowToScene({ payload }: SceneProps<HowToPayload>) {
  return (
    <SceneLayer>
      {groups()
        .filter((g) => g.beat <= payload.beat)
        .map((g) => (
          <Appear key={g.key}>{g.node}</Appear>
        ))}
    </SceneLayer>
  )
}
