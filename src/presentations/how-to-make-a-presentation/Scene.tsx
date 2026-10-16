import { Check, MessageCircle, User, Wrench } from 'lucide-react'
import { motion } from 'motion/react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { E, TRAY, slotX } from './entities'
import type { DeckPayload } from './types'

const GHOST_SLOT = 4
const VERIFY_SLOT = 5
const LINK_Y = TRAY.y + TRAY.h / 2

/** Links between consecutive tray items present at a given beat (card→card, then →ghost, →verify). */
function linkCount(n: number): number {
  if (n < 3) return 0
  if (n === 3) return 1
  if (n < 5) return 3
  return n < 7 ? 4 : 5
}

function StepCard({ n, stage }: { n: number; stage: number }) {
  const edited = stage >= 8 && n === 2
  const newest = (stage === 3 && n === 1) || (stage === 4 && n > 1)
  return (
    <Box
      id={E.card(n)}
      x={slotX(n - 1)}
      y={TRAY.y}
      w={TRAY.w}
      h={TRAY.h}
      className="htmp-card"
      data-emphasis={newest ? 'new' : edited ? 'edited' : 'off'}
    >
      <span className="htmp-card-title">Title {n}</span>
      <span className="htmp-card-caption">caption</span>
      <span className="htmp-card-visual" aria-hidden="true" />
    </Box>
  )
}

/**
 * One continuously evolving scene. Every step renders this same component
 * (shared `groupKey`); only `payload.stage` changes. Entities appear at their
 * introduction beat and are never moved or redrawn afterwards, except the
 * prompt bubble, which makes room for the question arrow.
 */
export function DeckScene({ payload }: SceneProps<DeckPayload>) {
  const n = payload.stage

  return (
    <SceneLayer className="htmp-scene" data-stage={n}>
      {/* conversation row */}
      <Box id={E.you} x={30} y={14} w={150} h={64} className="htmp-you" Icon={User} data-emphasis={n === 1 ? 'new' : 'off'} key="you">
        <span className="htmp-name">you</span>
      </Box>
      <Box
        id={E.prompt}
        x={n === 1 ? 210 : 200}
        y={n === 1 ? 20 : 22}
        w={n === 1 ? 300 : 180}
        h={n === 1 ? 52 : 48}
        className="htmp-prompt"
        key="prompt"
      >
        <span>{n === 1 ? '“I need a talk about my topic.”' : '“…about my topic.”'}</span>
      </Box>

      {n >= 2 ? (
        <Appear key="skill-layer">
          <Box id={E.skill} x={700} y={14} w={150} h={64} className="htmp-skill" Icon={MessageCircle} data-emphasis={n === 2 ? 'new' : 'off'}>
            <span className="htmp-name">skill</span>
          </Box>
          <Arrow id="htmp-ask" from={{ x: 396, y: 44 }} to={{ x: 690, y: 44 }} className="htmp-arrow" />
          <Arrow id="htmp-answer" from={{ x: 690, y: 62 }} to={{ x: 396, y: 62 }} className="htmp-arrow" />
          <SymbolChip id={E.question} x={470} y={8} w={140} h={22} className="htmp-chip" data-emphasis={n === 2 ? 'new' : 'off'}>
            one question?
          </SymbolChip>
        </Appear>
      ) : null}

      {/* tray */}
      {n >= 3 ? (
        <Appear key="tray-layer">
          <Box id={E.rail} x={14} y={252} w={842} h={6} className="htmp-rail" aria-hidden="true" />
        </Appear>
      ) : null}

      {n >= 3 ? (
        <Appear key="card-layer-1">
          <StepCard n={1} stage={n} />
        </Appear>
      ) : null}
      {n >= 4
        ? [2, 3, 4].map((c) => (
            <Appear key={`card-layer-${c}`} order={c - 2}>
              <StepCard n={c} stage={n} />
            </Appear>
          ))
        : null}

      {/* links between consecutive cards: what morphs */}
      {Array.from({ length: linkCount(n) }, (_, i) => i + 1).map((k) => {
        const toX = slotX(k)
        return (
          <Appear key={`link-layer-${k}`} order={k - 1}>
            <Arrow
              id={E.link(k)}
              from={{ x: slotX(k - 1) + TRAY.w + 4, y: LINK_Y }}
              to={{ x: toX - 4, y: LINK_Y }}
              className="htmp-arrow htmp-link"
            />
            <Label id={`${E.link(k)}-label`} x={slotX(k - 1) + TRAY.w} y={LINK_Y - 20} w={56} h={14} className="htmp-link-label">
              morphs
            </Label>
          </Appear>
        )
      })}

      {n >= 5 ? (
        <Appear key="ghost-layer">
          <Box id={E.ghost} x={slotX(GHOST_SLOT)} y={TRAY.y} w={TRAY.w} h={TRAY.h} className="htmp-ghost">
            <span className="htmp-card-title">Step 5</span>
            <span className="htmp-card-caption">unspecified</span>
          </Box>
          <SymbolChip id={E.control} x={30} y={78} w={150} h={22} className="htmp-chip htmp-control">
            partial ⇄ full
          </SymbolChip>
        </Appear>
      ) : null}

      {n >= 6 ? (
        <Appear key="socket-layer">
          <div data-presentation-allow-overlap>
            <Box id={E.socket} x={140} y={254} w={600} h={34} className="htmp-socket" data-emphasis={n === 6 ? 'new' : 'off'}>
              <span className="htmp-plug" aria-hidden="true" />
              <span className="htmp-socket-label">scene kit · shared boxes, arrows, motion</span>
            </Box>
          </div>
        </Appear>
      ) : null}

      {n >= 7 ? (
        <Appear key="verify-layer">
          <Box id={E.verify} x={slotX(VERIFY_SLOT)} y={TRAY.y} w={TRAY.w} h={TRAY.h} className="htmp-verify" Icon={Wrench} data-emphasis={n === 7 ? 'new' : 'off'}>
            <span className="htmp-card-title">verify</span>
            <span className="htmp-check-row">build ✓</span>
            <span className="htmp-check-row">render ✓</span>
            <span className="htmp-pass">
              <Check aria-hidden="true" /> pass
            </span>
          </Box>
        </Appear>
      ) : null}

      {n >= 8 ? (
        <Appear key="modify-layer">
          <svg
            className="htmp-modify"
            data-presentation-node="arrow"
            data-presentation-id="htmp-modify"
            width={880}
            height={380}
            viewBox="0 0 880 380"
            aria-hidden="true"
            style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            <motion.path
              d="M 780 80 C 780 114, 218 84, 218 118"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            <path d="M 218 124 L 212 113 L 224 113 Z" fill="currentColor" />
          </svg>
          <Label id="htmp-modify-label" x={440} y={80} w={64} h={16} className="htmp-chip htmp-modify-label">
            modify
          </Label>
        </Appear>
      ) : null}

      {n >= 9 ? (
        <Appear key="frame-layer">
          <div data-presentation-allow-overlap>
            <Frame id={E.frame} x={6} y={2} w={868} h={374} className="htmp-frame">
              <span className="htmp-frame-label">you’re looking at one — this talk was built exactly this way</span>
            </Frame>
          </div>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}
