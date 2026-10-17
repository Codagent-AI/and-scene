import { Presentation } from '../../presentation-kit/Presentation.tsx'
import { STEPS } from './steps/index.ts'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title={"How to Use This Skill to Make a Presentation"} initialMode="browse" className="how-to-make-a-presentation" />
}
