import { Sparkles, User } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[1]

function Scene() {
  return (
    <SceneLayer>
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
            <Emphasis layoutId={ENTITIES.questionChip} accent="amber" className="font-sans text-xs normal-case tracking-normal">
              Topic? Style? Step 3?
            </Emphasis>
          </Appear>
        </div>
        <Box layoutId={ENTITIES.you} Icon={User} label="You" accent="amber" />
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
