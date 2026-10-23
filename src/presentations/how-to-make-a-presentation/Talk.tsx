import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps/index.ts'
import './how-to.css'

export const TITLE = 'How to Use This Skill to Make a Presentation'

export default function Talk() {
  return (
    <div className="how-to">
      <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
    </div>
  )
}
