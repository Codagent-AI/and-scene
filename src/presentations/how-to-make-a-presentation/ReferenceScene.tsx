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
    <div className="flex items-center gap-10">
      <Box
        layoutId={ENTITIES.you}
        Icon={User}
        label="You"
        subtitle="topic in hand"
        accent="amber"
      />
      <Appear delay={0.2}>
        <Emphasis
          layoutId={ENTITIES.prompt}
          accent="cyan"
          className="max-w-[12rem] text-center font-sans text-sm normal-case tracking-normal"
        >
          <MessageCircle className="mx-auto mb-2 text-cyan" size={20} aria-hidden />
          &ldquo;I need a presentation about…&rdquo;
        </Emphasis>
      </Appear>
    </div>
  )
}

function InterviewBeat() {
  return (
    <div className="flex items-center gap-6">
      <Box
        layoutId={ENTITIES.skill}
        Icon={Sparkles}
        label="Skill"
        subtitle="one question at a time"
        accent="cyan"
      />
      <div className="flex flex-col items-center gap-2">
        <Arrow layoutId={ENTITIES.questionLoop} className="text-2xl">
          ↔
        </Arrow>
        <Appear delay={0.15}>
          <Emphasis
            layoutId={ENTITIES.questionChip}
            accent="amber"
            className="font-sans text-xs normal-case tracking-normal"
          >
            Topic? Style? Step 3?
          </Emphasis>
        </Appear>
      </div>
      <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" />
    </div>
  )
}

function StepStackBeat() {
  return (
    <div className="relative h-56 w-72">
      <Box
        layoutId={ENTITIES.stepCard1}
        Icon={Layers}
        label="Step 1"
        subtitle="title + caption"
        accent="gray"
        className="bottom-0 left-0"
      />
      <Box
        layoutId={ENTITIES.stepCard2}
        label="Step 2"
        subtitle="visual description"
        accent="gray"
        className="bottom-6 left-16 z-10"
      />
      <Box
        layoutId={ENTITIES.stepCard3}
        label="Step 3"
        subtitle="era + scene"
        accent="cyan"
        className="bottom-12 left-32 z-20"
      />
    </div>
  )
}

function DepthBeat() {
  return (
    <div className="flex items-center gap-16">
      <div className="flex flex-col gap-3">
        <Box layoutId={ENTITIES.stepCard1} label="Step 1" accent="gray" className="px-6 py-3 text-xs" />
        <Box layoutId={ENTITIES.stepCard2} label="Step 2" accent="gray" className="px-6 py-3 text-xs" />
        <Box layoutId={ENTITIES.stepCard3} label="…" accent="gray" className="px-6 py-3 text-xs" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" />
        <Emphasis
          layoutId={ENTITIES.depthControl}
          accent="amber"
          className="flex items-center gap-2 font-sans text-xs normal-case tracking-normal"
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
    <div className="flex items-center gap-5">
      <div className="flex flex-col gap-2">
        <Box layoutId={ENTITIES.stepCard2} label="steps" accent="gray" className="px-4 py-3 text-xs" />
        <Box layoutId={ENTITIES.stepCard3} label="…" accent="gray" className="px-4 py-2 text-xs" />
      </div>
      <Arrow layoutId={ENTITIES.questionLoop} />
      <SymbolChip
        layoutId={ENTITIES.sceneKit}
        Icon={Boxes}
        label="Scene kit"
        variant="chip"
        accent="cyan"
      />
      <Arrow layoutId={ENTITIES.modifyLoop} />
      <Box
        layoutId={ENTITIES.presentationRoute}
        Icon={Route}
        label="/your-talk"
        subtitle="one folder · one route"
        accent="green"
      />
    </div>
  )
}

function ChecksBeat() {
  return (
    <div className="flex items-center gap-6">
      <Box
        layoutId={ENTITIES.presentationRoute}
        Icon={Route}
        label="/your-talk"
        accent="green"
      />
      <Arrow layoutId={ENTITIES.questionLoop} />
      <Box
        layoutId={ENTITIES.verifyNode}
        Icon={ShieldCheck}
        label="verify"
        subtitle="build + render"
        accent="cyan"
      />
      <Appear delay={0.2}>
        <Box
          layoutId={ENTITIES.greenCheck}
          Icon={CheckCircle2}
          label="pass"
          accent="green"
          className="px-5 py-4"
        />
      </Appear>
    </div>
  )
}

function LoopBeat() {
  return (
    <div className="flex items-center gap-8">
      <Box layoutId={ENTITIES.stepCard2} label="gathering" accent="gray" className="px-6 py-4 text-xs" />
      <Arrow layoutId={ENTITIES.questionLoop} className="text-3xl text-amber">
        ↺
      </Arrow>
      <div className="relative">
        <Box layoutId={ENTITIES.presentationRoute} Icon={Route} label="/your-talk" accent="green" />
        <Emphasis
          layoutId={ENTITIES.modifyLoop}
          accent="amber"
          className="absolute -right-4 -top-5 font-sans text-xs normal-case tracking-normal"
        >
          <Pencil size={12} className="mr-1 inline" aria-hidden />
          modify
        </Emphasis>
      </div>
    </div>
  )
}

function RevealBeat() {
  return (
    <Frame layoutId={ENTITIES.revealFrame} label="this presentation" className="px-8 py-6">
      <div className="flex items-center justify-center gap-4">
        <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" className="px-4 py-3 text-xs" />
        <Box layoutId={ENTITIES.skill} Icon={Sparkles} label="Skill" accent="cyan" className="px-4 py-3 text-xs" />
        <Box layoutId={ENTITIES.sceneKit} Icon={Boxes} label="Kit" accent="cyan" className="px-4 py-3 text-xs" />
        <Box
          layoutId={ENTITIES.presentationRoute}
          Icon={Route}
          label="/how-to…"
          accent="green"
          className="px-4 py-3 text-xs"
        />
      </div>
      <Label layoutId={ENTITIES.depthControl} className="mt-4 text-center text-amber">
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
