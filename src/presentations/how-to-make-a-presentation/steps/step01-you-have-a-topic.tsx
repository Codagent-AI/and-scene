import { MessageCircle, User } from 'lucide-react'
import { Appear, Box, Emphasis, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import { REFERENCE_STEP_OUTLINE } from '../outline'

const meta = REFERENCE_STEP_OUTLINE[0]

function Scene() {
  return (
    <SceneLayer>
      <div className="flex items-center gap-10">
        <Box
          layoutId={ENTITIES.you}
          Icon={User}
          label="You"
          subtitle="topic in hand"
          accent="amber"
        />
        <Appear delay={0.2}>
          <Emphasis layoutId={ENTITIES.prompt} accent="cyan" className="max-w-[12rem] text-center font-sans text-sm normal-case tracking-normal">
            <MessageCircle className="mx-auto mb-2 text-cyan" size={20} aria-hidden />
            &ldquo;I need a presentation about…&rdquo;
          </Emphasis>
        </Appear>
      </div>
    </SceneLayer>
  )
}

export const step: Step = { ...meta, Scene }
