import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export const TITLE = 'How to Use This Skill to Make a Presentation'

export default function Talk() {
  return <Presentation steps={STEPS} title={TITLE} initialMode="browse" />
}
