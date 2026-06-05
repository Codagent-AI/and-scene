import { Presentation } from '../../presentation-kit'
import { step as step01 } from './steps/step01-you-have-a-topic'
import { step as step02 } from './steps/step02-skill-interviews'
import { step as step03 } from './steps/step03-answers-become-steps'
import { step as step04 } from './steps/step04-you-set-the-depth'
import { step as step05 } from './steps/step05-assembles-scene'
import { step as step06 } from './steps/step06-checks-work'
import { step as step07 } from './steps/step07-loop-it'
import { step as step08 } from './steps/step08-reveal'

export const STEPS = [step01, step02, step03, step04, step05, step06, step07, step08]

export default function Talk() {
  return (
    <Presentation
      steps={STEPS}
      title="How to Use This Skill to Make a Presentation"
      initialMode="browse"
    />
  )
}
