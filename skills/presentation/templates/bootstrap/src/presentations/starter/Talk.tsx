import { Presentation } from '../../presentation-kit/Presentation.tsx'
import { STEPS } from './steps/index.ts'
import './styles.css'

export default function Talk() {
  return <Presentation steps={STEPS} title="Starter presentation" initialMode="browse" className="starter" />
}
