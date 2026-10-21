import { Presentation } from '../../presentation-kit'
import './presentation.css'
import { STEPS } from './steps'

export default function Talk() {
  return <Presentation steps={STEPS} title="Starter presentation" initialMode="browse" />
}
