import { Presentation } from '../../presentation-kit/index.ts'
import { AllowedStack } from '../_shared/scenes.tsx'
import { twoSteps } from '../_shared/steps.ts'
import '../_shared/active.css'
import '../_shared/attribution.css'

export default function Talk() {
  return <Presentation steps={twoSteps(AllowedStack)} title="allowed"  />
}
