import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation title="Presentation title" steps={STEPS} initialMode="browse" />
}
