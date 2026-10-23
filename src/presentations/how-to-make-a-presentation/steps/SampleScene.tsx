import { Bot, Check, Flag, MessageCircle, Package, ShieldCheck, User } from 'lucide-react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { CARDS, E, TRAY, slotX } from '../entities'

export interface ScenePayload {
  /** Zero-based index of the active step; entities accumulate as it grows. */
  step: number
}

const cardMid = TRAY.y + TRAY.cardH / 2

/** One scene for every step: entities are added, never rearranged or redrawn. */
export function SampleScene({ payload }: SceneProps<ScenePayload>) {
  const s = payload.step
  const cardCount = s === 2 ? 1 : s >= 3 ? CARDS.length : 0
  // The first link dangles toward the next slot until more cards land.
  const linkCount = s >= 3 ? CARDS.length - 1 : s === 2 ? 1 : 0

  return (
    <SceneLayer>
      {s >= 8 && <Frame key={E.frame} id={E.frame} x={6} y={4} width={868} height={372} />}
      {s >= 8 && (
        <Label key={E.frameLabel} id={E.frameLabel} x={620} y={348} width={240} height={22}>
          built with this skill
        </Label>
      )}

      <Box key={E.you} id={E.you} x={64} y={22} width={140} height={60} Icon={User}>
        <span>you</span>
      </Box>
      <Label key={E.prompt} id={E.prompt} x={64} y={90} width={140} height={26}>
        “a topic…”
      </Label>

      {s >= 1 && (
        <Box key={E.skill} id={E.skill} x={676} y={22} width={140} height={60} Icon={Bot}>
          <span>skill</span>
        </Box>
      )}
      {s >= 1 && <Arrow key={E.talk} id={E.talk} from={{ x: 204, y: 52 }} to={{ x: 676, y: 52 }} bidirectional />}
      {s >= 1 && (
        <SymbolChip key={E.question} id={E.question} x={410} y={18} width={60} height={26} Icon={MessageCircle}>
          <span>?</span>
        </SymbolChip>
      )}

      {s >= 4 && (
        <Box key={E.depth} id={E.depth} x={64} y={118} width={140} height={24}>
          <span>partial ↔ full</span>
        </Box>
      )}

      {s >= 2 && (
        <Label key={E.tray} id={E.tray} x={slotX(0)} y={145} width={180} height={18}>
          the story so far
        </Label>
      )}
      {CARDS.slice(0, cardCount).map((i) => (
        <Box key={E.card(i)} id={E.card(i)} x={slotX(i)} y={TRAY.y} width={TRAY.cardW} height={TRAY.cardH} />
      ))}
      {CARDS.slice(0, cardCount).flatMap((i) => [
        <Label key={E.cardTitle(i)} id={E.cardTitle(i)} x={slotX(i) + 8} y={TRAY.y + 8} width={96} height={20}>
          title
        </Label>,
        <Label key={E.cardCaption(i)} id={E.cardCaption(i)} x={slotX(i) + 8} y={TRAY.y + 34} width={96} height={20}>
          caption
        </Label>,
        <Label key={E.cardVisual(i)} id={E.cardVisual(i)} x={slotX(i) + 8} y={TRAY.y + 60} width={96} height={20}>
          visual
        </Label>,
      ])}
      {CARDS.slice(0, linkCount).map((i) => (
          <Arrow
            key={E.link(i)}
            id={E.link(i)}
            from={{ x: slotX(i) + TRAY.cardW, y: cardMid }}
            to={{ x: slotX(i + 1), y: cardMid }}
          />
        ))}
      {s >= 2 && (
        <Label key={E.morphs} id={E.morphs} x={slotX(0) + TRAY.cardW - 20} y={cardMid + 24} width={60} height={18}>
          morphs
        </Label>
      )}

      {s >= 4 && (
        <Box key={E.ghost} id={E.ghost} x={slotX(4)} y={TRAY.y} width={TRAY.cardW} height={TRAY.cardH}>
          <span>?</span>
        </Box>
      )}

      {s >= 5 && (
        <Box key={E.kit} id={E.kit} x={260} y={TRAY.y + TRAY.cardH + 14} width={360} height={48} Icon={Package}>
          <span>scene kit</span>
        </Box>
      )}
      {s >= 5 && (
        <Arrow
          key={E.kitPlug}
          id={E.kitPlug}
          from={{ x: 440, y: TRAY.y + TRAY.cardH + 14 }}
          to={{ x: 440, y: TRAY.y + TRAY.cardH + 1 }}
        />
      )}

      {s >= 6 && (
        <Arrow
          key={E.verifyLink}
          id={E.verifyLink}
          from={{ x: slotX(4) + TRAY.cardW, y: cardMid }}
          to={{ x: slotX(5), y: cardMid }}
        />
      )}
      {s >= 6 && (
        <Box key={E.verify} id={E.verify} x={slotX(5)} y={TRAY.y} width={TRAY.cardW} height={TRAY.cardH} Icon={ShieldCheck}>
          <span>verify</span>
        </Box>
      )}
      {s >= 6 && (
        <SymbolChip key={E.pass} id={E.pass} x={slotX(5) + 36} y={TRAY.y + 74} width={40} height={26} Icon={Check} />
      )}

      {s >= 7 && (
        <Box key={E.route} id={E.route} x={64} y={316} width={160} height={40}>
          <span>/your-talk</span>
        </Box>
      )}
      {s >= 7 && <Arrow key={E.modify} id={E.modify} from={{ x: 64, y: 52 }} to={{ x: 64, y: 336 }} curve={90} />}
      {s >= 7 && (
        <Emphasis key={E.flag} id={E.flag} x={slotX(1) - 6} y={TRAY.y - 6} width={TRAY.cardW + 12} height={TRAY.cardH + 12}>
          <Flag aria-hidden="true" />
        </Emphasis>
      )}
    </SceneLayer>
  )
}
