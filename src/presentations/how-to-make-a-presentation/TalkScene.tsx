import type { ReactNode } from 'react'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  Presence,
  SceneLayer,
  SymbolChip,
  type SceneProps,
} from '../../presentation-kit'
import { AT, cardAt, E, linkLabelAt } from './entities'

export interface TalkPayload {
  /** 1-based number of the beat this state shows; entities accumulate with it. */
  n: number
}

function Card({ i }: { i: number }) {
  return (
    <Box entity={E.card(i)} at={cardAt(i)} data-sample="step-card" className="hmp-card">
      <span data-sample-part="title">title</span>
      <span data-sample-part="caption">caption</span>
      <span data-sample-part="visual">visual</span>
    </Box>
  )
}

/** Introduces a group of entities after the persisting ones settle; unmounts with a fade. */
function Group({ id, show, delay, children }: { id: string; show: boolean; delay?: number; children: ReactNode }) {
  return <Presence>{show && <Appear key={id} data-sample-group={id} delay={delay}>{children}</Appear>}</Presence>
}

export function TalkScene({ payload: { n } }: SceneProps<TalkPayload>) {
  const stubbed = n < 4
  return (
    <SceneLayer data-sample-n={n}>
      <Group id="you" show={n >= 1} delay={0}>
        <Box entity={E.you} at={AT.you} data-sample="you" className="hmp-actor"><span>you</span></Box>
        <Box entity={E.prompt} at={AT.prompt} data-sample="prompt" className="hmp-bubble"><span>“explain my topic”</span></Box>
      </Group>

      <Group id="skill" show={n >= 2}>
        <Box entity={E.skill} at={AT.skill} data-sample="skill" className="hmp-actor"><span>skill</span></Box>
        <Arrow entity={E.conversation} from={[190, 68]} to={[690, 68]} bidirectional data-sample="conversation" className="hmp-line" />
        <SymbolChip entity={E.question} at={AT.question} symbol="question?" data-sample="question" className="hmp-chip" />
      </Group>

      <Group id="tray" show={n >= 3}>
        <Box entity={E.tray} at={AT.tray} data-sample="tray" className="hmp-tray" />
        <Card i={0} />
      </Group>
      {/* The link between consecutive cards persists and stretches when the next card lands. */}
      <Group id="link-0" show={n >= 3}>
        <Arrow entity={E.link(0)} from={[154, 225]} to={[stubbed ? 176 : 184, 225]} data-sample="link" className="hmp-line" />
        <Label entity={E.linkLabel(0)} at={linkLabelAt(0)} data-sample="link-label" className="hmp-small">morphs</Label>
      </Group>

      <Group id="more-cards" show={n >= 4}>
        {[1, 2, 3].map((i) => <Card key={i} i={i} />)}
        {[1, 2].map((i) => (
          <Arrow key={i} entity={E.link(i)} from={[(cardAt(i).x) + 108, 225]} to={[cardAt(i + 1).x, 225]} data-sample="link" className="hmp-line" />
        ))}
        {[1, 2].map((i) => (
          <Label key={i} entity={E.linkLabel(i)} at={linkLabelAt(i)} data-sample="link-label" className="hmp-small">morphs</Label>
        ))}
      </Group>

      <Group id="depth" show={n >= 5}>
        <Box entity={E.ghost} at={AT.ghost} data-sample="ghost" className="hmp-card hmp-ghost"><span>? step</span></Box>
        <Box entity={E.control} at={AT.control} data-sample="depth-control" className="hmp-control"><span>partial ↔ full</span></Box>
      </Group>

      <Group id="socket" show={n >= 6}>
        <Arrow entity={E.socketPlug} from={[440, 314]} to={[440, 300]} data-sample="socket-plug" className="hmp-line" />
        <Box entity={E.socket} at={AT.socket} data-sample="scene-kit" className="hmp-socket"><span>shared scene kit</span></Box>
      </Group>

      <Group id="verify" show={n >= 7}>
        <Arrow entity={E.verifyLink} from={[706, 225]} to={[744, 225]} data-sample="verify-link" className="hmp-line" />
        <Box entity={E.verify} at={AT.verify} data-sample="verify" className="hmp-verify"><span>verify</span></Box>
        <SymbolChip entity={E.buildChip} at={AT.buildChip} symbol="build" data-sample="build-chip" className="hmp-chip" />
        <SymbolChip entity={E.renderChip} at={AT.renderChip} symbol="render" data-sample="render-chip" className="hmp-chip" />
        <SymbolChip entity={E.passChip} at={AT.passChip} symbol="✓" data-sample="pass-check" data-state="pass" className="hmp-chip hmp-pass" />
      </Group>

      <Group id="modify" show={n >= 8}>
        <Arrow entity={E.modifyArc} from={[765, 100]} to={[376, 168]} curve={40} data-sample="modify-arc" className="hmp-line hmp-modify" />
        <Label entity={E.modifyLabel} at={AT.modifyLabel} data-sample="modify-label" className="hmp-small">modify</Label>
        <Emphasis entity={E.editedFlag} at={AT.editedFlag} data-sample="edited-flag" className="hmp-flag" />
        <SymbolChip entity={E.editedChip} at={AT.editedChip} symbol="edited" data-sample="edited-chip" className="hmp-chip hmp-edited" />
      </Group>

      <Group id="reveal" show={n >= 9}>
        <Frame entity={E.frame} at={AT.frame} data-sample="outer-frame" className="hmp-outer" />
        <Label entity={E.frameLabel} at={AT.frameLabel} data-sample="frame-label" className="hmp-frame-label">made with this skill</Label>
      </Group>
    </SceneLayer>
  )
}
