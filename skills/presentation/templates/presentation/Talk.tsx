import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './talk.css'

export default function Talk() {
  return (
    <div className="p-{{slug}}">
      <Presentation steps={STEPS} title="{{title}}" initialMode="browse" />
    </div>
  )
}
