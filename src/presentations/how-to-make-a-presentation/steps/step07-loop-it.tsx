import { Pencil, Route } from 'lucide-react'
import { Arrow, Box, Emphasis, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[6]

function Scene() {
  return (
    <SceneLayer>
      <div className="flex items-center gap-8">
        <Box layoutId={ENTITIES.stepCard2} label="gathering" accent="gray" className="px-6 py-4 text-xs opacity-80" />
        <Arrow layoutId={ENTITIES.questionLoop} className="text-3xl text-amber">
          ↺
        </Arrow>
        <div className="relative">
          <Box layoutId={ENTITIES.presentationRoute} Icon={Route} label="/your-talk" accent="green" />
          <Emphasis
            layoutId={ENTITIES.modifyLoop}
            accent="amber"
            className="absolute -right-4 -top-5 rotate-6 font-sans text-xs normal-case tracking-normal"
          >
            <Pencil size={12} className="mr-1 inline" aria-hidden />
            modify
          </Emphasis>
        </div>
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
