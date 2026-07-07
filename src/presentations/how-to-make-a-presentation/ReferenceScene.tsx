import type { ReactNode } from 'react'
import {
  Boxes,
  CheckCircle2,
  Layers,
  MessageCircle,
  Pencil,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'

function TopicBeat() {
  return (
    <div className="ref-row ref-row--wide">
      <Box
        layoutId={ENTITIES.you}
        Icon={User}
        label="You"
        subtitle="topic in hand"
        accent="amber"
        className="ref-box"
      />
      <Appear delay={0.2}>
        <Emphasis
          layoutId={ENTITIES.prompt}
          accent="cyan"
          className="ref-emphasis ref-emphasis--prompt"
        >
          <MessageCircle className="ref-message-icon" size={20} aria-hidden />
          &ldquo;I need a presentation about…&rdquo;
        </Emphasis>
      </Appear>
    </div>
  )
}

function InterviewBeat() {
  return (
    <div className="ref-row ref-row--medium">
      <Box
        layoutId={ENTITIES.skill}
        Icon={Sparkles}
        label="Skill"
        subtitle="one question at a time"
        accent="cyan"
        className="ref-box"
      />
      <div className="ref-column ref-column--tight">
        <Arrow layoutId={ENTITIES.questionLoop} className="ref-arrow ref-arrow--large">
          ↔
        </Arrow>
        <Appear delay={0.15}>
          <Emphasis
            layoutId={ENTITIES.questionChip}
            accent="amber"
            className="ref-emphasis ref-emphasis--small"
          >
            Topic? Style? Step 3?
          </Emphasis>
        </Appear>
      </div>
      <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" className="ref-box" />
    </div>
  )
}

function StepStackBeat() {
  return (
    <div className="ref-step-stack">
      <Box
        layoutId={ENTITIES.stepCard1}
        Icon={Layers}
        label="Step 1"
        subtitle="title + caption"
        accent="gray"
        className="ref-box ref-step-stack-card ref-step-stack-card--one"
      />
      <Box
        layoutId={ENTITIES.stepCard2}
        label="Step 2"
        subtitle="visual description"
        accent="gray"
        className="ref-box ref-step-stack-card ref-step-stack-card--two"
      />
      <Box
        layoutId={ENTITIES.stepCard3}
        label="Step 3"
        subtitle="era + scene"
        accent="cyan"
        className="ref-box ref-step-stack-card ref-step-stack-card--three"
      />
    </div>
  )
}

function DepthBeat() {
  return (
    <div className="ref-row ref-row--extra-wide">
      <div className="ref-column ref-column--medium">
        <Box layoutId={ENTITIES.stepCard1} label="Step 1" accent="gray" className="ref-box ref-box--compact" />
        <Box layoutId={ENTITIES.stepCard2} label="Step 2" accent="gray" className="ref-box ref-box--compact" />
        <Box layoutId={ENTITIES.stepCard3} label="…" accent="gray" className="ref-box ref-box--compact" />
      </div>
      <div className="ref-column ref-column--center">
        <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" className="ref-box" />
        <Emphasis
          layoutId={ENTITIES.depthControl}
          accent="amber"
          className="ref-emphasis ref-emphasis--control"
        >
          <SlidersHorizontal size={14} aria-hidden />
          partial ↔ full
        </Emphasis>
      </div>
    </div>
  )
}

function AssemblyBeat() {
  return (
    <div className="ref-row ref-row--small">
      <div className="ref-column ref-column--tight">
        <Box layoutId={ENTITIES.stepCard2} label="steps" accent="gray" className="ref-box ref-box--tiny" />
        <Box layoutId={ENTITIES.stepCard3} label="…" accent="gray" className="ref-box ref-box--tiny" />
      </div>
      <Arrow layoutId={ENTITIES.questionLoop} className="ref-arrow" />
      <SymbolChip
        layoutId={ENTITIES.sceneKit}
        Icon={Boxes}
        label="Scene kit"
        variant="chip"
        accent="cyan"
      />
      <Arrow layoutId={ENTITIES.modifyLoop} className="ref-arrow" />
      <Box
        layoutId={ENTITIES.presentationRoute}
        Icon={Route}
        label="/your-talk"
        subtitle="one folder · one route"
        accent="green"
        className="ref-box"
      />
    </div>
  )
}

function ChecksBeat() {
  return (
    <div className="ref-row ref-row--medium">
      <Box
        layoutId={ENTITIES.presentationRoute}
        Icon={Route}
        label="/your-talk"
        accent="green"
        className="ref-box"
      />
      <Arrow layoutId={ENTITIES.questionLoop} className="ref-arrow" />
      <Box
        layoutId={ENTITIES.verifyNode}
        Icon={ShieldCheck}
        label="verify"
        subtitle="build + render"
        accent="cyan"
        className="ref-box"
      />
      <Appear delay={0.2}>
        <Box
          layoutId={ENTITIES.greenCheck}
          Icon={CheckCircle2}
          label="pass"
          accent="green"
          className="ref-box ref-box--pass"
        />
      </Appear>
    </div>
  )
}

function LoopBeat() {
  return (
    <div className="ref-row ref-row--large">
      <Box layoutId={ENTITIES.stepCard2} label="gathering" accent="gray" className="ref-box ref-box--compact" />
      <Arrow layoutId={ENTITIES.questionLoop} className="ref-arrow ref-arrow--loop">
        ↺
      </Arrow>
      <div className="ref-relative">
        <Box layoutId={ENTITIES.presentationRoute} Icon={Route} label="/your-talk" accent="green" className="ref-box" />
        <Emphasis
          layoutId={ENTITIES.modifyLoop}
          accent="amber"
          className="ref-emphasis ref-emphasis--modify"
        >
          <Pencil size={12} className="ref-inline-icon" aria-hidden />
          modify
        </Emphasis>
      </div>
    </div>
  )
}

function RevealBeat() {
  return (
    <Frame layoutId={ENTITIES.revealFrame} label="this presentation" className="ref-frame">
      <div className="ref-row ref-row--reveal">
        <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" className="ref-box ref-box--tiny" />
        <Box layoutId={ENTITIES.skill} Icon={Sparkles} label="Skill" accent="cyan" className="ref-box ref-box--tiny" />
        <Box layoutId={ENTITIES.sceneKit} Icon={Boxes} label="Kit" accent="cyan" className="ref-box ref-box--tiny" />
        <Box
          layoutId={ENTITIES.presentationRoute}
          Icon={Route}
          label="/how-to…"
          accent="green"
          className="ref-box ref-box--tiny"
        />
      </div>
      <Label layoutId={ENTITIES.depthControl} className="ref-built-label">
        built exactly this way
      </Label>
    </Frame>
  )
}

export function ReferenceScene({ step }: SceneProps) {
  const beats: Record<string, ReactNode> = {
    'you-have-a-topic': <TopicBeat />,
    'skill-interviews-you': <InterviewBeat />,
    'answers-become-steps': <StepStackBeat />,
    'you-set-the-depth': <DepthBeat />,
    'assembles-the-scene': <AssemblyBeat />,
    'checks-its-work': <ChecksBeat />,
    'loop-it': <LoopBeat />,
    reveal: <RevealBeat />,
  }
  const beat = beats[step.id]
  if (!beat) throw new Error(`Unknown reference step id: ${step.id}`)

  return <SceneLayer>{beat}</SceneLayer>
}
