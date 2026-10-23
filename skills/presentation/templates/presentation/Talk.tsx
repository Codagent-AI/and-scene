import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return <Presentation title="Replace with the presentation title" steps={STEPS} initialMode="browse" />
}
