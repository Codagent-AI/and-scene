import { Presentation } from '../../presentation-kit/index.ts'
import { REFERENCE_PRESENTATION_TITLE, REFERENCE_STEPS } from './steps/index.tsx'
import './presentation.css'

export default function Talk() {
  return (
    <Presentation
      steps={REFERENCE_STEPS}
      title={REFERENCE_PRESENTATION_TITLE}
      initialMode="browse"
      className="sample-presentation"
    />
  )
}
