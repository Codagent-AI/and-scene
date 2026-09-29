import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Presentation title" initialMode="browse" />
}
