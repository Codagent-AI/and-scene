import { ArrowLeftRight, Check } from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit/index.ts'
import { E, G } from './entities.ts'

export interface ScenePayload {
  /** 1-based beat; the scene shows every entity introduced at or before it. */
  beat: number
}

/** A step card carries the parts every step has: title, caption, visual. */
function CardParts({ n }: { n: number }) {
  return (
    <>
      <b data-part="head">step {n}</b>
      <span data-part="row"><i>title</i><u data-bar="short" /></span>
      <span data-part="row"><i>caption</i><u data-bar="long" /></span>
      <span data-part="row"><i>visual</i><u data-bar="block" /></span>
    </>
  )
}

/**
 * One evolving scene: a single persistent instance whose entities accumulate per beat.
 * Newcomers are wrapped in <Appear>; entities that persist keep their `id` (layoutId) and coordinates.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  const { beat } = payload
  return (
    <SceneLayer>
      <Appear key="ask">
        <Box id={E.you} at={G.you} data-role="you">
          <strong>you</strong>
          <small>the topic</small>
        </Box>
        <SymbolChip id={E.prompt} at={G.prompt} data-role="bubble">prompt: a topic</SymbolChip>
      </Appear>
      {beat >= 2 && (
        <Appear key="interview">
          <Box id={E.skill} at={G.skill} data-role="skill">
            <strong>skill</strong>
            <small>asks, builds</small>
          </Box>
          <Arrow id={E.convo} {...G.convo} bidirectional />
          <SymbolChip id={E.question} at={G.question}>question</SymbolChip>
        </Appear>
      )}
      {beat >= 3 && (
        <Appear key="tray">
          <Label id={E.trayLabel} at={G.trayLabel} data-role="tray-label">step tray</Label>
          <Box id={E.card1} at={G.card1} data-role="card"><CardParts n={1} /></Box>
          <Arrow id={E.link1} {...G.link1} />
          <Label id={E.link1Label} at={G.link1Label} data-role="link-label">morphs</Label>
        </Appear>
      )}
      {beat >= 4 && (
        <Appear key="grow">
          <Box id={E.card2} at={G.card2} data-role="card"><CardParts n={2} /></Box>
          <Arrow id={E.link2} {...G.link2} />
          <Label id={E.link2Label} at={G.link2Label} data-role="link-label">morphs</Label>
          <Box id={E.card3} at={G.card3} data-role="card" data-edited={beat >= 8 ? 'true' : undefined}>
            <CardParts n={3} />
          </Box>
        </Appear>
      )}
      {beat >= 5 && (
        <Appear key="depth">
          <Arrow id={E.link3} {...G.link3} dashed />
          <Label id={E.link3Label} at={G.link3Label} data-role="link-label">more</Label>
          <Box id={E.ghost} at={G.ghost} data-role="ghost">
            <strong>unspecified</strong>
            <small>sketched, not spelled out</small>
          </Box>
          <SymbolChip id={E.depth} at={G.depth} Icon={ArrowLeftRight} data-role="control">partial / full</SymbolChip>
        </Appear>
      )}
      {beat >= 6 && (
        <Appear key="kit">
          <Arrow id={E.plug} {...G.plug} />
          <Box id={E.kit} at={G.kit} data-role="socket">
            <strong>scene-kit</strong>
            <small>shared kit the scene is drawn with</small>
          </Box>
        </Appear>
      )}
      {beat >= 7 && (
        <Appear key="verify">
          <Arrow id={E.link4} {...G.link4} />
          <Label id={E.link4Label} at={G.link4Label} data-role="link-label">checks</Label>
          <Box id={E.verify} at={G.verify} data-role="verify">
            <strong>verify</strong>
            <small>build + render</small>
          </Box>
          <SymbolChip id={E.pass} at={G.pass} Icon={Check} state="pass">build + render</SymbolChip>
        </Appear>
      )}
      {beat >= 8 && (
        <Appear key="modify">
          <Arrow id={E.modify} {...G.modify} bend={-26} dashed />
          <Label id={E.modifyLabel} at={G.modifyLabel} data-role="link-label">modify</Label>
          <SymbolChip id={E.edited} at={G.edited} data-role="flag">edited</SymbolChip>
        </Appear>
      )}
      {beat >= 9 && (
        <Appear key="reveal">
          <Frame id={E.frame} at={G.frame} data-presentation-allow-overlap="">
            <span data-role="frame-label">you are looking at the output of this skill</span>
          </Frame>
        </Appear>
      )}
    </SceneLayer>
  )
}
