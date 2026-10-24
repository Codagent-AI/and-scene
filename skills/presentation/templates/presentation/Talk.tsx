import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return <Presentation className="__NAMESPACE__" steps={STEPS} title="__TITLE__" initialMode="browse" />
}
