import { Fragment } from 'react'
import { Arrow, Box, Emphasis, Frame, Label, Presence, SceneLayer, SymbolChip } from '../../../presentation-kit'
import { entities } from '../entities'
import type { SceneProps } from '../../../presentation-kit'

export interface SampleState { beat: number }

const cardCopy = [
  ['title', 'caption', 'visual'], ['shape', 'position', 'continuity'], ['question', 'answer', 'choice'],
  ['entities', 'states', 'motion'], ['build', 'render', 'repair'], ['create', 'modify', 'review'],
  ['scene', 'story', 'reveal'],
]

export function SampleScene({ payload }: SceneProps<SampleState>) {
  const beat = payload.beat
  const cards = Math.max(beat >= 2 ? 1 : 0, beat >= 3 ? 4 : 0, beat >= 5 ? 6 : 0, beat >= 6 ? 7 : 0)
  return <SceneLayer className="sample-scene">
    <div className="conversation" data-presentation-allow-overlap="">
      <Box id={entities.you} className="person entity" style={{ left: 38, top: 34 }}><span className="entity-kicker">the author</span><strong>you</strong><span className="entity-mark">01</span></Box>
      <Box id={entities.prompt} className="prompt entity" style={{ left: 190, top: 47 }}><span className="entity-kicker">starting point</span><strong>A topic</strong><span className="prompt-dot" /></Box>
      <Presence>{beat >= 1 && <Fragment key="dialogue"><Box id={entities.skill} className="skill entity" style={{ left: 650, top: 34 }}><span className="entity-kicker">your collaborator</span><strong>the skill</strong><span className="entity-mark">↗</span></Box>
        <Arrow id={entities.conversation} className="conversation-arrow" style={{ left: 330, top: 84, width: 300 }} label="Two-way conversation" />
        <SymbolChip id={entities.question} className="question-chip" style={{ left: 435, top: 61 }}>one question at a time</SymbolChip></Fragment>}</Presence>
    </div>
    <Presence>{beat >= 2 && <Fragment key="tray">
      <div className="tray-label">ANSWERS, MADE TANGIBLE <span>01 — {String(cards).padStart(2, '0')}</span></div>
      <div className="card-tray" data-presentation-allow-overlap="">
        <Presence>{Array.from({ length: cards }, (_, index) => <Box key={entities.cards[index]} id={entities.cards[index]} className={`step-card ${index === 0 ? 'step-card-first' : ''} ${beat === 7 && index === 2 ? 'step-card-edited' : ''}`} style={{ left: 25 + index * 102, top: 207 }}>
          <span className="card-number">{String(index + 1).padStart(2, '0')}</span><strong>step {index + 1}</strong>
          <span className="card-parts">{cardCopy[index].map((part) => <i key={part}>{part}</i>)}</span>
          {index < cards - 1 && beat >= 3 && <span className="morph-link" aria-label="morphs into">↝</span>}
          <Presence>{beat === 7 && index === 2 && <Label key="edited" id={entities.edited} className="edited-flag">EDITED</Label>}</Presence>
        </Box>)}</Presence>
        <Presence>{beat >= 6 && <Fragment key="verify"><Arrow id="sample-verify-connector" className="verify-connector" style={{ left: 728, top: 253, width: 46 }} label="Step cards lead to verification" />
        <Box id={entities.verify} className="verify-node" style={{ left: 774, top: 207 }}><span className="entity-kicker">quality gate</span><strong>verify</strong><span className="pass-check">✓</span><small>build + render</small></Box></Fragment>}</Presence>
      </div>
    </Fragment>}</Presence>
    <Presence>{beat >= 4 && <Fragment key="depth">
      <Box id={entities.ghost} className="ghost-card" style={{ left: 612, top: 334 }}><span>…</span> room to add more</Box>
      <Emphasis id={entities.depth} className="depth-control" style={{ left: 50, top: 320 }}><span>your depth</span><strong>partial <b>↔</b> detailed</strong></Emphasis>
    </Fragment>}</Presence>
    <Presence>{beat >= 5 && <Fragment key="kit">
      <div className="kit-connector" aria-hidden="true" />
      <Box id={entities.kit} className="kit-socket" style={{ left: 387, top: 327 }}><span className="socket-icon">◈</span><span><small>drawn with the shared</small><strong>scene kit</strong></span></Box>
    </Fragment>}</Presence>
    <Presence>{beat >= 7 && <Fragment key="modify">
      <div className="modify-arc" data-presentation-allow-overlap="" aria-label="Modify loop reaches from the conversation to the route"><span>ask for a change</span><i>↘</i><b>↶</b></div>
    </Fragment>}</Presence>
    <Presence>{beat >= 8 && <Frame key="reveal" id={entities.reveal} className="reveal-frame" style={{ left: 12, top: 15, width: 850, height: 350 }}><span>AN EXAMPLE OF ITS OWN OUTPUT</span></Frame>}</Presence>
  </SceneLayer>
}
