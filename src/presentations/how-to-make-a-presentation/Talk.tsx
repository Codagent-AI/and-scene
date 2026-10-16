import { Presentation } from '../../presentation-kit/index.ts'
import { STEPS } from './steps.ts'
import './styles.css'

export default function Talk() {
  return (
    <div className="p-how-to-make-a-presentation">
      <Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />
    </div>
  )
}
