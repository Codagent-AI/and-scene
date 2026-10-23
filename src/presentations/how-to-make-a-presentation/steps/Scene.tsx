import type { ReactElement } from 'react'
import { Check, Flag, Route, Sparkles, User, Wrench, Layers, ShieldCheck } from 'lucide-react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { AT, CARD_Y_MID, E } from '../entities'

export interface SamplePayload {
  /** 1-based beat; each beat adds entities and never moves existing ones. */
  stage: number
}

/** The one evolving scene: later beats add to what is already on screen. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const s = payload.stage
  const items: ReactElement[] = []

  if (s >= 1) {
    items.push(
      <Box key="you" layoutId={E.you} at={AT.you} Icon={User} appear>
        you
      </Box>,
      <Label key="prompt" layoutId={E.prompt} at={AT.prompt} variant="bubble" appear>
        a topic
      </Label>,
    )
  }
  if (s >= 2) {
    items.push(
      <Box key="skill" layoutId={E.skill} at={AT.skill} Icon={Sparkles} appear>
        skill
      </Box>,
      <Arrow key="talk" layoutId={E.talk} from={{ x: 184, y: 90 }} to={{ x: 696, y: 90 }} bidirectional appear />,
      <SymbolChip key="question" layoutId={E.question} at={AT.question} appear>
        which topic?
      </SymbolChip>,
    )
  }
  if (s >= 3) {
    items.push(
      <Label key="tray" layoutId={E.trayLabel} at={AT.trayLabel} variant="caption" appear>
        step cards
      </Label>,
      <Box key="card1" layoutId={E.card(1)} at={AT.card(1)} variant="card" appear>
        <Label layoutId={E.cardParts(1, 'title')} variant="part">title</Label>
        <Label layoutId={E.cardParts(1, 'caption')} variant="part">caption</Label>
        <Label layoutId={E.cardParts(1, 'visual')} variant="part">visual</Label>
      </Box>,
    )
  }
  if (s >= 4) {
    items.push(
      <Box key="card2" layoutId={E.card(2)} at={AT.card(2)} variant="card" appear>step 2</Box>,
      <Box key="card3" layoutId={E.card(3)} at={AT.card(3)} variant="card" appear>step 3</Box>,
      <Arrow key="link1" layoutId={E.link(1)} from={{ x: 172, y: CARD_Y_MID }} to={{ x: 193, y: CARD_Y_MID }} appear />,
      <Label key="linkLabel" layoutId={E.linkLabel} at={AT.linkLabel} variant="caption" appear>
        what morphs
      </Label>,
      <Arrow key="link2" layoutId={E.link(2)} from={{ x: 327, y: CARD_Y_MID }} to={{ x: 348, y: CARD_Y_MID }} appear />,
    )
  }
  if (s >= 5) {
    items.push(
      <Box key="ghost" layoutId={E.ghost} at={AT.card(4)} variant="ghost" appear>
        step ?
      </Box>,
      <SymbolChip key="depth" layoutId={E.depth} at={AT.depth} appear>
        partial ↔ full
      </SymbolChip>,
    )
  }
  if (s >= 6) {
    items.push(
      <Arrow key="plug" layoutId={E.kitPlug} from={{ x: 420, y: 282 }} to={{ x: 420, y: 314 }} appear />,
      <Box key="kit" layoutId={E.kit} at={AT.kit} Icon={Layers} variant="socket" appear>
        shared scene kit
      </Box>,
    )
  }
  if (s >= 7) {
    items.push(
      <Arrow key="chain" layoutId={E.chain} from={{ x: 640, y: 228 }} to={{ x: 696, y: 228 }} appear />,
      <Box key="verify" layoutId={E.verify} at={AT.verify} Icon={ShieldCheck} appear>
        verify
      </Box>,
      <SymbolChip key="pass" layoutId={E.pass} at={AT.pass} Icon={Check} variant="pass" appear>
        pass
      </SymbolChip>,
    )
  }
  if (s >= 8) {
    items.push(
      <Box key="route" layoutId={E.route} at={AT.route} Icon={Route} appear>
        route
      </Box>,
      <Arrow key="modify" layoutId={E.modify} from={{ x: 844, y: 90 }} to={{ x: 844, y: 340 }} bend={-36} variant="modify" appear />,
      <Emphasis key="edited" layoutId={E.edited} at={AT.card(2)} variant="edited" appear />,
      <SymbolChip key="flag" layoutId={E.flag} at={AT.flag} Icon={Flag} variant="flag" appear>
        edited
      </SymbolChip>,
    )
  }
  if (s >= 9) {
    items.push(
      <Frame key="frame" layoutId={E.frame} at={AT.frame} appear />,
      <Label key="frameLabel" layoutId={E.frameLabel} at={AT.frameLabel} variant="frame-label" appear>
        <Wrench aria-hidden="true" data-presentation-glyph="" /> this presentation
      </Label>,
    )
  }

  return <SceneLayer>{items}</SceneLayer>
}
