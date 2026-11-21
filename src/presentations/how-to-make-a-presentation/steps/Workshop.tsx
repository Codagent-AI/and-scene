import { ArrowDown, ArrowLeftRight, ArrowRight, Check, Layers3, MessageSquare, Sparkles, UserRound } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ids } from '../entities'

export type Beat = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

function StepCard({ id, order, detail }: { id: string; order: number; detail?: boolean }) {
  return (
    <Box id={id} className="workshop-card">
      <span className="workshop-card-number">{String(order).padStart(2, '0')}</span>
      {detail
        ? <div className="workshop-card-detail"><b>Title</b><span>Caption</span><span>Visual</span></div>
        : <b>Step {order}</b>}
    </Box>
  )
}

export function Workshop({ payload: beat }: SceneProps<Beat>) {
  return (
    <SceneLayer className="workshop">
      <Appear key="you" className="workshop-you">
        <Box id={ids.you} className="workshop-person" icon={UserRound}>You</Box>
      </Appear>
      <Appear key="prompt" className="workshop-prompt">
        <Label id={ids.prompt} className="workshop-chip"><MessageSquare aria-hidden="true" /> I have a topic.</Label>
      </Appear>
      {beat >= 2 && <Appear key="skill" className="workshop-skill">
        <Box id={ids.skill} className="workshop-person workshop-agent" icon={Sparkles}>The skill</Box>
      </Appear>}
      {beat >= 2 && <Appear key="exchange" className="workshop-exchange">
        <Arrow id={ids.exchange} className="workshop-double-arrow"><ArrowLeftRight aria-hidden="true" /></Arrow>
      </Appear>}
      {beat >= 2 && <Appear key="question" className="workshop-question">
        <SymbolChip id={ids.question} className="workshop-chip">One question at a time</SymbolChip>
      </Appear>}
      {beat >= 3 && <Appear key="tray" className="workshop-tray">
        <Label id={ids.tray} className="workshop-tray-label">Story steps</Label>
      </Appear>}
      {beat >= 3 && <Appear key="one" className="workshop-one">
        <StepCard id={ids.cardOne} order={1} detail />
      </Appear>}
      {beat >= 4 && <Appear key="morph-one" className="workshop-morph workshop-morph-one">
        <Arrow id={ids.firstMorph}><span>Morph</span><ArrowRight aria-hidden="true" /></Arrow>
      </Appear>}
      {beat >= 4 && <Appear key="two" className="workshop-two">
        <StepCard id={ids.cardTwo} order={2} />
      </Appear>}
      {beat >= 4 && <Appear key="morph-two" className="workshop-morph workshop-morph-two">
        <Arrow id={ids.secondMorph}><span>Morph</span><ArrowRight aria-hidden="true" /></Arrow>
      </Appear>}
      {beat >= 4 && <Appear key="three" className="workshop-three">
        <StepCard id={ids.cardThree} order={3} />
      </Appear>}
      {beat >= 5 && <Appear key="ghost" className="workshop-ghost">
        <Box id={ids.ghost} className="workshop-card workshop-ghost-card">Optional</Box>
      </Appear>}
      {beat >= 5 && <Appear key="depth" className="workshop-depth">
        <SymbolChip id={ids.depth} className="workshop-chip">Partial <ArrowLeftRight aria-hidden="true" /> Full</SymbolChip>
      </Appear>}
      {beat >= 6 && <Appear key="kit" className="workshop-kit">
        <Box id={ids.kit} className="workshop-socket" icon={Layers3}>Shared scene kit</Box>
      </Appear>}
      {beat >= 7 && <Appear key="verify-link" className="workshop-verification-link">
        <Arrow id={ids.verificationLink}><ArrowRight aria-hidden="true" /></Arrow>
      </Appear>}
      {beat >= 7 && <Appear key="verify" className="workshop-verification">
        <Box id={ids.verification} className="workshop-verify">
          <b><Check aria-hidden="true" /> Verified</b>
          <span>Build + render</span>
        </Box>
      </Appear>}
      {beat >= 8 && <Appear key="modify" className="workshop-modify">
        <Arrow id={ids.modify} className="workshop-arc">
          <span>Modify</span><ArrowDown aria-hidden="true" />
        </Arrow>
      </Appear>}
      {beat >= 8 && <Appear key="edited" className="workshop-edit">
        <Emphasis id={ids.edited} data-presentation-allow-overlap="">Edited</Emphasis>
      </Appear>}
      {beat >= 9 && <Appear key="reveal" className="workshop-reveal">
        <Frame id={ids.reveal}><span>You’re looking at the result</span></Frame>
      </Appear>}
    </SceneLayer>
  )
}
