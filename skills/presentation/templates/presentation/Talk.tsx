import { Presentation } from '../../presentation-kit/Presentation.tsx'
import { STEPS } from './steps/index.tsx'
import './style.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Presentation title" initialMode="browse" />
}
