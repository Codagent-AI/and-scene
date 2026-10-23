import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Starter Presentation" initialMode="browse" />
}
