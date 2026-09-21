import { Presentation } from '@presentation-kit'
import { STEPS } from './steps'
import './presentation.css'

export default function Talk() {
  return <Presentation className="presentation" steps={STEPS} title="{{TITLE}}" initialMode="browse" />
}
