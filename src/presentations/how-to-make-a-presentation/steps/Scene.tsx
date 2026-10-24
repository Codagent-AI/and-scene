import { ArrowLeftRight, Check, Pencil, Plug, SlidersHorizontal, Sparkles } from 'lucide-react'
import {
  Appear,
  Arrow,
  Box,
  DESIGN_H,
  DESIGN_W,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
  type SceneProps,
} from '../../../presentation-kit'
import { CARD, cardX, E } from '../entities'

export interface SamplePayload {
  /** Number of the active step, 1-9. Entities appear once `n` reaches theirs. */
  n: number
}

const LINK_Y = CARD.y + CARD.h / 2

function StepCard({ n }: { n: number }) {
  return (
    <Box id={E.card(n)} x={cardX(n)} y={CARD.y} w={CARD.w} h={CARD.h} className="card">
      <span className="card-part">title</span>
      <span className="card-part">caption</span>
      <Sparkles data-presentation-glyph="" aria-hidden="true" className="card-visual" />
    </Box>
  )
}

function CardLink({ from }: { from: number }) {
  const x1 = cardX(from) + CARD.w
  const x2 = cardX(from + 1)
  return (
    <>
      <Arrow
        id={E.link(from)}
        from={[x1, LINK_Y]}
        to={[x2, LINK_Y]}
        width={DESIGN_W}
        height={DESIGN_H}
        className="link"
      />
      <SymbolChip
        id={E.morph(from)}
        x={x1 + 4}
        y={LINK_Y - 26}
        w={22}
        h={22}
        Icon={ArrowLeftRight}
        label="what morphs"
        className="morph-chip"
      />
    </>
  )
}

/**
 * One scene for all nine steps. The scene instance persists (shared group key)
 * and each step only adds entities, so everything already on screen stays put.
 */
export function SampleScene({ payload: { n } }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer>
      {n >= 9 && (
        <Appear key="frame">
          <Frame id={E.frame} x={6} y={6} w={868} h={368} className="frame" />
          <Label id={E.frameLabel} x={250} y={338} w={380} h={26} className="frame-label">
            this presentation, built by the skill
          </Label>
        </Appear>
      )}
      {n >= 1 && (
        <Appear key="you">
          <Box id={E.you} x={30} y={44} w={150} h={64} className="actor you">
            you
          </Box>
          <Label id={E.prompt} x={210} y={6} w={140} h={36} className="bubble">
            “a topic…”
          </Label>
        </Appear>
      )}
      {n >= 2 && (
        <Appear key="skill">
          <Box id={E.skill} x={690} y={44} w={150} h={64} className="actor skill">
            skill
          </Box>
          <Arrow
            id={E.conversation}
            from={[184, 76]}
            to={[686, 76]}
            both
            width={DESIGN_W}
            height={DESIGN_H}
            className="conversation"
          />
          <SymbolChip id={E.question} x={440} y={32} w={150} h={30} className="question">
            which topic?
          </SymbolChip>
        </Appear>
      )}
      {n >= 3 && (
        <Appear key="card-0">
          <StepCard n={0} />
        </Appear>
      )}
      {n >= 4 &&
        [1, 2, 3].map((i) => (
          <Appear key={`card-${i}`}>
            <CardLink from={i - 1} />
            <StepCard n={i} />
          </Appear>
        ))}
      {n >= 5 && (
        <Appear key="depth">
          <Box id={E.ghost} x={cardX(4)} y={CARD.y} w={CARD.w} h={CARD.h} variant="ghost" className="card ghost">
            <span className="card-part">?</span>
          </Box>
          <Box id={E.depth} x={30} y={118} w={150} h={26} Icon={SlidersHorizontal} className="depth">
            partial ↔ full
          </Box>
        </Appear>
      )}
      {n >= 6 && (
        <Appear key="kit">
          <Arrow
            id={E.kitPlug}
            from={[cardX(2) + CARD.w / 2, CARD.y + CARD.h]}
            to={[cardX(2) + CARD.w / 2, 276]}
            width={DESIGN_W}
            height={DESIGN_H}
            className="plug"
          />
          <Box id={E.kit} x={cardX(1)} y={278} w={cardX(3) + CARD.w - cardX(1)} h={44} Icon={Plug} className="kit">
            scene kit · boxes · arrows · motion
          </Box>
        </Appear>
      )}
      {n >= 7 && (
        <Appear key="verify">
          <Arrow
            id={E.chain}
            from={[cardX(4) + CARD.w, LINK_Y]}
            to={[690, LINK_Y]}
            width={DESIGN_W}
            height={DESIGN_H}
            className="link"
          />
          <Box id={E.verify} x={690} y={CARD.y} w={150} h={CARD.h} className="verify">
            <span className="verify-title">verify</span>
            <span className="verify-sub">build · render</span>
          </Box>
          <SymbolChip id={E.pass} x={822} y={CARD.y - 10} w={26} h={26} Icon={Check} label="checks pass" className="pass" />
        </Appear>
      )}
      {n >= 8 && (
        <Appear key="modify">
          <Arrow
            id={E.modify}
            from={[765, 112]}
            to={[cardX(1) + CARD.w / 2, CARD.y - 4]}
            bend={[460, 90]}
            width={DESIGN_W}
            height={DESIGN_H}
            className="modify"
          />
          <Label id={E.modifyTag} x={540} y={116} w={80} h={22} className="modify-tag">
            modify
          </Label>
          <Emphasis id={E.edited} x={cardX(1) - 5} y={CARD.y - 5} w={CARD.w + 10} h={CARD.h + 10} className="edited" />
          <SymbolChip
            id={E.editedFlag}
            x={cardX(1) + CARD.w - 14}
            y={CARD.y - 14}
            w={24}
            h={24}
            Icon={Pencil}
            label="edited"
            className="edited-flag"
          />
        </Appear>
      )}
    </SceneLayer>
  )
}
