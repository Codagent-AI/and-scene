import { CheckCircle2 } from 'lucide-react'
import { Box } from '../../presentation-kit/nodes/Box'
import { Label } from '../../presentation-kit/nodes/Label'
import { Arrow } from '../../presentation-kit/nodes/Arrow'
import { Frame } from '../../presentation-kit/nodes/Frame'
import { SymbolChip } from '../../presentation-kit/nodes/SymbolChip'
import { Appear } from '../../presentation-kit/nodes/Appear'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer'
import { ENTITY } from './entities'

export interface ScenePayload {
  step: number
}

// One continuously evolving scene shared by every step of this presentation:
// entities appear once (via `Appear`, keyed to a stable `layoutId`) and never
// leave or redraw — later steps only add to what is already on screen.
export function Scene({ payload, active }: { payload: ScenePayload; active: boolean }) {
  const { step } = payload
  const at = (introducedAt: number) => step >= introducedAt
  const isNew = (introducedAt: number) => step === introducedAt && active

  return (
    <SceneLayer data-presentation-node="scene-root">
      {at(9) ? (
        <Frame
          layoutId={ENTITY.outerFrame}
          className="reveal-frame"
          data-presentation-active={isNew(9)}
        >
          <Label className="reveal-frame-label">this presentation</Label>
        </Frame>
      ) : null}

      <Box layoutId={ENTITY.you} className="node-you" data-presentation-active={isNew(1)}>
        <Label>you</Label>
      </Box>

      {at(1) ? (
        <Appear className="node-prompt-slot">
          <Box layoutId={ENTITY.prompt} className="node-prompt" data-presentation-active={isNew(1)}>
            <Label>“I need a talk about…”</Label>
          </Box>
        </Appear>
      ) : null}

      {at(5) ? (
        <Appear className="node-depth-slot">
          <SymbolChip
            layoutId={ENTITY.depthControl}
            label="partial ↔ full"
            className="node-depth"
            data-presentation-active={isNew(5)}
          />
        </Appear>
      ) : null}

      {at(2) ? (
        <Appear className="node-skill-slot">
          <Box layoutId={ENTITY.skill} className="node-skill" data-presentation-active={isNew(2)}>
            <Label>skill</Label>
          </Box>
        </Appear>
      ) : null}

      {at(2) ? (
        <Appear className="connector-slot">
          <Arrow layoutId={ENTITY.connector} className="connector-arrow" data-presentation-active={isNew(2)}>
            {/* The SVG has no viewBox, so lengths are CSS pixels in the slot
                `.connector-slot` sizes. Percentages keep the two-way arrow
                spanning that whole slot — from `you` across to `skill` — instead
                of stopping at a fixed user-unit width. */}
            <line x1="1%" y1="12" x2="99%" y2="12" markerEnd="url(#arrow-end)" markerStart="url(#arrow-start)" />
            <defs>
              <marker id="arrow-end" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
              <marker id="arrow-start" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
                <path d="M8,0 L0,4 L8,8 Z" />
              </marker>
            </defs>
          </Arrow>
        </Appear>
      ) : null}

      {at(2) ? (
        <Appear className="question-chip-slot">
          <SymbolChip
            layoutId={ENTITY.questionChip}
            label="topic? look? beats?"
            className="node-question-chip"
            data-presentation-active={isNew(2)}
          />
        </Appear>
      ) : null}

      {at(3) ? (
        <Appear className="tray-slot" data-presentation-allow-overlap="true">
          <Label layoutId={ENTITY.tray} className="tray-label" data-presentation-active={isNew(3)}>
            steps
          </Label>
        </Appear>
      ) : null}

      {at(3) ? (
        <Appear className="card-step-slot">
          <Box
            layoutId={ENTITY.cardStep}
            className="node-card"
            data-presentation-active={isNew(3)}
          >
            <Label>title · caption · visual</Label>
          </Box>
        </Appear>
      ) : null}

      {at(4) ? (
        <Appear className="card-deck-slot">
          <Box
            layoutId={ENTITY.cardDeck}
            className={`node-card${at(8) ? ' node-card--edited' : ''}`}
            data-presentation-active={isNew(4) || isNew(8)}
          >
            <Label>+ more beats</Label>
            {at(8) ? <Label className="edited-flag">edited</Label> : null}
          </Box>
        </Appear>
      ) : null}

      {at(5) ? (
        <Appear className="ghost-card-slot">
          <Box
            layoutId={ENTITY.ghostCard}
            className="node-card node-card--ghost"
            data-presentation-active={isNew(5)}
          >
            <Label>unspecified</Label>
          </Box>
        </Appear>
      ) : null}

      {at(7) ? (
        <Appear className="verify-node-slot">
          <Box
            layoutId={ENTITY.verifyNode}
            className="node-verify"
            icon={CheckCircle2}
            data-presentation-active={isNew(7)}
          >
            <Label>verify</Label>
          </Box>
        </Appear>
      ) : null}

      {at(6) ? (
        <Appear className="scene-kit-slot">
          <Box layoutId={ENTITY.sceneKit} className="node-scene-kit" data-presentation-active={isNew(6)}>
            <Label>scene kit</Label>
          </Box>
        </Appear>
      ) : null}

      {at(8) ? (
        <Appear className="modify-arc-slot">
          <Arrow layoutId={ENTITY.modifyArc} className="modify-arrow" data-presentation-active={isNew(8)}>
            {/* Reaches from under the conversation row down to just above the
                edited card. It stops short of the card so the arrowhead points
                at it rather than printing over its label. */}
            <path d="M54,32 C100,40 144,52 144,78" markerEnd="url(#modify-end)" />
            <defs>
              <marker id="modify-end" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" />
              </marker>
            </defs>
          </Arrow>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}
