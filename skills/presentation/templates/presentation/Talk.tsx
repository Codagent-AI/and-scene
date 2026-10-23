import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './style.css'

export default function Talk() {
  return <Presentation className="__NAME__" steps={STEPS} title="__TITLE__" initialMode="browse" />
}
