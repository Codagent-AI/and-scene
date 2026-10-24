import { Check, Blocks, Route, Shuffle, ShieldCheck, Sparkles, ToggleLeft, User, CircleQuestionMark } from 'lucide-react'
import type { ReactNode } from 'react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
import { GEOMETRY } from './entities.ts'
import type { EntityId, SamplePayload } from './entities.ts'

const g = (id: EntityId) => ({ id, x: GEOMETRY[id].x, y: GEOMETRY[id].y, width: GEOMETRY[id].w, height: GEOMETRY[id].h })

const line = (id: EntityId) => {
  const { x, y, w, h } = GEOMETRY[id]
  return { id, from: { x, y }, to: { x: x + w, y: y + h } }
}

const Parts = ({ n }: { n: number }) => (
  <>
    <span data-part="number">{n}</span>
    <span data-part="title">title</span>
    <span data-part="caption">caption</span>
    <span data-part="visual">visual</span>
  </>
)

const card = (id: EntityId, n: number) => (
  <Box {...g(id)} className="card">
    <Parts n={n} />
  </Box>
)

const morph = (id: EntityId) => <SymbolChip {...g(id)} icon={Shuffle} className="morph-chip" />

const VIEWS: Record<EntityId, () => ReactNode> = {
  you: () => <Box {...g('you')} icon={User} className="actor">you</Box>,
  prompt: () => <Label {...g('prompt')} className="prompt">“explain my topic”</Label>,
  skill: () => <Box {...g('skill')} icon={Sparkles} className="actor">skill</Box>,
  'you-skill': () => <Arrow {...line('you-skill')} bidirectional />,
  question: () => <SymbolChip {...g('question')} icon={CircleQuestionMark} symbol="question" className="question-chip" />,
  control: () => <Box {...g('control')} icon={ToggleLeft} className="depth-control">partial ↔ full</Box>,
  tray: () => <Label {...g('tray')} className="tray">step cards</Label>,
  'card-1': () => card('card-1', 1),
  'card-2': () => card('card-2', 2),
  'card-3': () => card('card-3', 3),
  'card-4': () => card('card-4', 4),
  'link-1': () => <Arrow {...line('link-1')} />,
  'link-2': () => <Arrow {...line('link-2')} />,
  'link-3': () => <Arrow {...line('link-3')} />,
  'morph-1': () => morph('morph-1'),
  'morph-2': () => morph('morph-2'),
  'morph-3': () => morph('morph-3'),
  ghost: () => <Box {...g('ghost')} className="card ghost">?</Box>,
  socket: () => <Box {...g('socket')} icon={Blocks} className="socket">scene kit</Box>,
  plug: () => <Arrow {...line('plug')} />,
  verify: () => <Box {...g('verify')} icon={ShieldCheck} className="verify">verify</Box>,
  'verify-link': () => <Arrow {...line('verify-link')} head={5} />,
  'verify-check': () => <SymbolChip {...g('verify-check')} icon={Check} className="pass-chip" data-presentation-allow-overlap="" />,
  route: () => <Box {...g('route')} icon={Route} className="route">/your-presentation</Box>,
  modify: () => <Arrow {...line('modify')} bend={130} className="modify-arc" />,
  flag: () => <Emphasis {...g('flag')} className="edited-flag" />,
  frame: () => <Frame {...g('frame')} label="you're looking at one" className="reveal-frame" />,
}

const LAYERS: readonly { name: string; ids: readonly EntityId[] }[] = [
  { name: 'conversation', ids: ['you', 'prompt', 'skill', 'you-skill', 'question', 'control'] },
  {
    name: 'tray',
    ids: ['tray', 'card-1', 'card-2', 'card-3', 'card-4', 'link-1', 'link-2', 'link-3', 'morph-1', 'morph-2', 'morph-3', 'ghost', 'socket', 'plug', 'verify', 'verify-link', 'verify-check'],
  },
  { name: 'route', ids: ['route', 'modify', 'flag'] },
  { name: 'reveal', ids: ['frame'] },
]

/**
 * One scene shared by all nine steps (same groupKey): the instance persists
 * and only the visible set changes, so retained entities stay put and morph in
 * place while newcomers fade in once they settle.
 */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const shown = new Set(payload.visible)
  return (
    <>
      {LAYERS.map((layer) => (
        <SceneLayer key={layer.name} data-layer={layer.name}>
          {layer.ids
            .filter((id) => shown.has(id))
            .map((id) => (
              <Appear key={id}>{VIEWS[id]()}</Appear>
            ))}
        </SceneLayer>
      ))}
    </>
  )
}
