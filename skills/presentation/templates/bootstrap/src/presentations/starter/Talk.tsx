import { Presentation } from '../../presentation-kit'
import './style.css'
import { STEPS } from './steps'

export default function Talk() {
  return <Presentation className="deck" steps={STEPS} title="Starter presentation" initialMode="browse" />
}
