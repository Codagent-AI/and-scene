import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return (
    <div className="__CLASS__">
      <Presentation steps={STEPS} title="__TITLE__" initialMode="browse" />
    </div>
  )
}
