import { Boxes, Route, Sparkles, User } from 'lucide-react'
import { Box, Frame, Label, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[7]

function Scene() {
  return (
    <SceneLayer>
      <Frame layoutId={ENTITIES.revealFrame} label="this presentation" className="px-8 py-6">
        <div className="flex items-center justify-center gap-4">
          <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" className="scale-75 px-4 py-3" />
          <Box layoutId={ENTITIES.skill} Icon={Sparkles} label="Skill" accent="cyan" className="scale-75 px-4 py-3" />
          <Box layoutId={ENTITIES.sceneKit} Icon={Boxes} label="Kit" accent="cyan" className="scale-75 px-4 py-3" />
          <Box layoutId={ENTITIES.presentationRoute} Icon={Route} label="/how-to…" accent="green" className="scale-75 px-4 py-3" />
        </div>
        <Label layoutId={ENTITIES.depthControl} className="mt-4 text-center text-amber">
          built exactly this way
        </Label>
      </Frame>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
