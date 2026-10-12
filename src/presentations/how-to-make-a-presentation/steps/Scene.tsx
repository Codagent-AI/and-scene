import { Arrow } from '../../../presentation-kit/nodes/Arrow'
import { Box } from '../../../presentation-kit/nodes/Box'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis'
import { Frame } from '../../../presentation-kit/nodes/Frame'
import { Label } from '../../../presentation-kit/nodes/Label'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip'
import { ENTITIES } from '../entities'
import { OUTLINE } from './outline'

export type SamplePayload = { through: number }
const cardTitles = ['Ask', 'Gather', 'Shape', 'Build', 'Reveal']

export function Scene({ payload }: { payload: SamplePayload }) {
  const step = payload.through
  return <div className="sample-scene" data-sample-step={step}>
    <SceneLayer x={52} y={34} className="conversation">
      <Box layoutId={ENTITIES.you} className="person you"><span className="avatar">Y</span><span>you</span></Box>
      {step >= 1 && <Box layoutId={ENTITIES.prompt} className="prompt"><span>“I have a topic…”</span></Box>}
      {step >= 2 && <>
        <Arrow layoutId={ENTITIES.conversation} className="conversation-arrow" aria-label="Two-way conversation" />
        <Box layoutId={ENTITIES.skill} className="person skill"><span className="avatar">S</span><span>skill</span></Box>
        <SymbolChip layoutId={ENTITIES.question} className="question">one question at a time</SymbolChip>
      </>}
      {step >= 5 && <div className="depth-control" data-presentation-allow-overlap=""><span>partial</span><b>↔</b><span>full</span></div>}
    </SceneLayer>

    {step >= 3 && <>
      <SceneLayer x={42} y={168} className="tray-area" data-presentation-allow-overlap="">
        <Label className="tray-label">THE STORY TAKES SHAPE</Label>
        <div className="tray-rail" />
        {Array.from({ length: step >= 4 ? 4 : 1 }, (_, index) => <Box key={index} layoutId={ENTITIES.cards[index]} className={`step-card card-${index + 1}`}>
          <span className="card-number">0{index + 1}</span><strong>{cardTitles[index]}</strong>
          <span className="card-detail">{index === 0 && step === 3 ? <>{OUTLINE[0].title}<br/><small>caption · visual</small></> : 'one clear beat'}</span>
          <span className="card-visual"><i /><i /><i /></span>
        </Box>)}
        {step >= 4 && <div className="morph-link"><span>what morphs</span><b>→</b></div>}
        {step >= 5 && <Box layoutId={ENTITIES.ghost} className="step-card ghost-card"><span className="card-number">···</span><strong>your next beat</strong><span className="card-detail">when you’re ready</span></Box>}
        {step >= 7 && <>
          <Arrow layoutId={ENTITIES.verifyConnector} className="verify-connector" />
          <Box layoutId={ENTITIES.verify} className="verify-card"><strong>verify</strong><span>build + render</span><b>✓</b></Box>
        </>}
        {step >= 8 && <Emphasis layoutId={ENTITIES.edited} className="edited-flag">EDITED</Emphasis>}
      </SceneLayer>
    </>}

    {step >= 6 && <>
      <SceneLayer x={370} y={304} className="kit-socket" data-presentation-allow-overlap="">
        <Arrow layoutId={ENTITIES.kitStem} className="socket-stem" />
        <Box layoutId={ENTITIES.kit} className="kit-label"><span className="kit-mark">◈</span><span><small>DRAWN WITH</small><strong>the shared scene kit</strong></span></Box>
      </SceneLayer>
    </>}

    {step >= 8 && <SceneLayer x={565} y={32} className="modify-arc" data-presentation-allow-overlap=""><Arrow layoutId={ENTITIES.modify} className="modify-line" /><Label>“change step 2”</Label></SceneLayer>}
    {step >= 9 && <Frame layoutId={ENTITIES.reveal} className="reveal-frame"><span>AN EXAMPLE OF ITS OWN OUTPUT</span></Frame>}
  </div>
}
