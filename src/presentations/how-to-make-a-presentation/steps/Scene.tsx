import { Check, Flag, Blocks, MessageCircleQuestion, Image, SlidersHorizontal, Sparkles, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { Arrow, Box, Frame, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { ARROWS, BOXES, entityId, type ArrowKey, type BoxKey, type EntityKey } from '../entities'
import type { Beat } from './beats'

const LINK_TEXT: Record<string, string> = {
  'link-label-1': 'morph',
  'link-label-2': 'morph',
  'link-label-3': 'morph',
  'link-label-4': 'morph',
  'link-label-5': 'then',
}

function StepCard({ hook }: { hook: string }) {
  return (
    <>
      <span className="htmp-part htmp-part-title" data-htmp-part={`${hook}-title`}>title</span>
      <span className="htmp-part htmp-part-caption" data-htmp-part={`${hook}-caption`}>caption</span>
      <span className="htmp-part htmp-part-visual" data-htmp-part={`${hook}-visual`}>
        <Image aria-hidden="true" />
      </span>
    </>
  )
}

function renderBox(key: BoxKey, on: boolean): ReactNode {
  const r = BOXES[key]
  const id = entityId(key)
  const common = { id, ...r, emphasis: on }
  if (key === 'frame') {
    return (
      <Frame key={key} {...common} data-presentation-allow-overlap="">
        <span className="htmp-frame-label" data-htmp-frame-label="">
          <Sparkles aria-hidden="true" /> this talk — made with the skill it describes
        </span>
      </Frame>
    )
  }
  switch (key) {
    case 'prompt':
      return <Box key={key} {...common} kind="prompt" label="“my topic…”" />
    case 'you':
      return <Box key={key} {...common} kind="actor" Icon={User} label="you" />
    case 'skill':
      return <Box key={key} {...common} kind="actor" Icon={Sparkles} label="skill" />
    case 'question':
      return <SymbolChip key={key} {...common} Icon={MessageCircleQuestion} label="which look?" />
    case 'tray':
      return <Box key={key} {...common} kind="tray" />
    case 'tray-label':
      return <Box key={key} {...common} kind="label" label="step tray" />
    case 'card-1':
    case 'card-2':
    case 'card-3':
    case 'card-4':
      return (
        <Box key={key} {...common} kind="step-card">
          <StepCard hook={key} />
        </Box>
      )
    case 'ghost':
      return (
        <Box key={key} {...common} kind="ghost-card">
          <span className="htmp-part htmp-part-ghost">not yet specified</span>
        </Box>
      )
    case 'depth-control':
      return <Box key={key} {...common} kind="depth-control" Icon={SlidersHorizontal} label="partial ↔ full" />
    case 'scene-kit':
      return <Box key={key} {...common} kind="socket" Icon={Blocks} label="shared scene kit" />
    case 'verify':
      return (
        <Box key={key} {...common} kind="verify">
          <span className="htmp-part htmp-part-title">verify</span>
          <span className="htmp-part htmp-part-check">build</span>
          <span className="htmp-part htmp-part-check">render</span>
        </Box>
      )
    case 'verify-check':
      return (
        <Box
          key={key}
          {...common}
          kind="pass-check"
          Icon={Check}
          data-presentation-allow-overlap=""
          data-htmp-state="pass"
        />
      )
    case 'modify-label':
      return <Box key={key} {...common} kind="label" label="modify" />
    case 'flag':
      return <Box key={key} {...common} kind="flag" Icon={Flag} data-presentation-allow-overlap="" />
    default:
      return <Box key={key} {...common} kind="link-label" label={LINK_TEXT[key]} />
  }
}

function renderArrow(key: ArrowKey): ReactNode {
  const a = ARROWS[key]
  return (
    <Arrow
      key={key}
      id={entityId(key)}
      {...a}
      data-presentation-allow-overlap=""
      data-htmp-line={key === 'modify' ? 'modify' : 'link'}
    />
  )
}

const isArrow = (k: EntityKey): k is ArrowKey => k in ARROWS

/** The one Scene for all nine steps: the payload only says which entities are present. */
export function Scene({ payload }: SceneProps<Beat>) {
  const emphasized = new Set<EntityKey>(payload.emphasized)
  return (
    <SceneLayer>
      {payload.visible.map((key) => (isArrow(key) ? renderArrow(key) : renderBox(key, emphasized.has(key))))}
    </SceneLayer>
  )
}

