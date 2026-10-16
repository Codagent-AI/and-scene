import { Bot, Check, SlidersHorizontal, User, ShieldCheck } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { AT, CARD_COUNT, GHOST_AT, ID, POINTS, cardAt, cardId, linkId, linkPoints } from '../entities'

export interface SamplePayload {
  /** 1-based beat; every entity appears at a threshold and then persists. */
  n: number
}

const cardIndices = Array.from({ length: CARD_COUNT }, (_, i) => i)

/** One evolving scene: entities accumulate across beats and are never redrawn. */
export function SampleScene({ payload: { n } }: SceneProps<SamplePayload>) {
  const cardsShown = n >= 4 ? CARD_COUNT : n >= 3 ? 1 : 0
  return (
    <SceneLayer>
      {n >= 1 && (
        <Appear key="you">
          <Box id={ID.you} at={AT.you} Icon={User} data-kind="actor">you</Box>
        </Appear>
      )}
      {n >= 1 && (
        <Appear key="prompt">
          <Label id={ID.prompt} at={AT.prompt} data-kind="bubble">“explain a topic”</Label>
        </Appear>
      )}
      {n >= 2 && (
        <Appear key="skill">
          <Box id={ID.skill} at={AT.skill} Icon={Bot} data-kind="actor">skill</Box>
        </Appear>
      )}
      {n >= 2 && (
        <Appear key="convo">
          <Arrow id={ID.talk} from={POINTS.convoFrom} to={POINTS.convoTo} bidirectional />
        </Appear>
      )}
      {n >= 2 && (
        <Appear key="question">
          <SymbolChip id={ID.question} at={AT.question} symbol="?" data-kind="chip" />
        </Appear>
      )}
      {n >= 3 && (
        <Appear key="tray">
          <Box id={ID.tray} at={AT.tray} data-kind="tray" />
        </Appear>
      )}
      {n >= 3 && (
        <Appear key="tray-label">
          <Label id={ID.trayLabel} at={AT.trayLabel} data-kind="tray-label">your presentation · own route</Label>
        </Appear>
      )}
      {cardIndices.slice(0, cardsShown).map((i) => (
        <Appear key={cardId(i)}>
          <Box id={cardId(i)} at={cardAt(i)} data-kind="card">
            <span data-part="num">step {i + 1}</span>
            <span data-part="title">title</span>
            <span data-part="caption">caption</span>
            <span data-part="visual">visual</span>
          </Box>
        </Appear>
      ))}
      {n >= 3 && (
        <Appear key="link-1">
          <Arrow id={linkId(0)} {...linkPoints(0)} dashed={n < 4} />
        </Appear>
      )}
      {n >= 3 && (
        <Appear key="morph">
          <Label id={ID.morph} at={AT.morph} data-kind="note">what morphs</Label>
        </Appear>
      )}
      {n >= 4 &&
        [1, 2].map((i) => (
          <Appear key={linkId(i)}>
            <Arrow id={linkId(i)} {...linkPoints(i)} />
          </Appear>
        ))}
      {n >= 5 && (
        <Appear key="ghost">
          <Box id={ID.ghost} at={GHOST_AT} data-kind="ghost">
            <span data-part="num">step ?</span>
            <span data-part="title">unspecified</span>
          </Box>
        </Appear>
      )}
      {n >= 5 && (
        <Appear key="depth">
          <Box id={ID.depth} at={AT.depth} Icon={SlidersHorizontal} data-kind="control">partial ↔ full</Box>
        </Appear>
      )}
      {n >= 6 && (
        <Appear key="kit">
          <Box id={ID.kit} at={AT.kit} data-kind="socket">scene kit</Box>
        </Appear>
      )}
      {n >= 7 && (
        <Appear key="chain">
          <Arrow id={ID.chain} from={POINTS.chainFrom} to={POINTS.chainTo} />
        </Appear>
      )}
      {n >= 7 && (
        <Appear key="verify">
          <Box id={ID.verify} at={AT.verify} Icon={ShieldCheck} data-kind="verify">verify</Box>
        </Appear>
      )}
      {n >= 7 && (
        <Appear key="check" delay={1.1}>
          <SymbolChip id={ID.check} at={AT.check} Icon={Check} data-kind="pass" />
        </Appear>
      )}
      {n >= 8 && (
        <Appear key="modify">
          <Arrow id={ID.modify} from={POINTS.modifyFrom} to={POINTS.modifyTo} bend={28} />
        </Appear>
      )}
      {n >= 8 && (
        <Appear key="edited">
          <Emphasis id={ID.edited} at={{ ...cardAt(1), x: cardAt(1).x - 6, y: cardAt(1).y - 6, w: 112, h: 122 }} data-kind="flag">
            <span data-part="flag">edited</span>
          </Emphasis>
        </Appear>
      )}
      {n >= 9 && (
        <Appear key="frame">
          <Frame id={ID.frame} at={AT.frame} label="you are looking at one" data-kind="reveal" />
        </Appear>
      )}
    </SceneLayer>
  )
}
