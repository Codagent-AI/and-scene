import { Presentation } from '../../presentation-kit/index.ts'
import { Plain } from '../_shared/scenes.tsx'
import { twoSteps } from '../_shared/steps.ts'
import '../_shared/active.css'
import './tiny.css'

export default function Talk() {
  return <Presentation steps={twoSteps(Plain)} title="tiny" />
}
