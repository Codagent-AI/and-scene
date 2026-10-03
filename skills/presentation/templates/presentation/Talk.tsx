import { Presentation } from '../../presentation-kit'
import { STEPS } from './steps'
import './{{SLUG}}.css'

/**
 * Entry component for {{TITLE}}. Renders the whole evolving scene from the
 * ordered STEPS array. Styling lives in `{{SLUG}}.css`, imported here so it
 * only loads when this presentation's route is visited.
 */
export default function Talk() {
  return <Presentation steps={STEPS} title="{{TITLE}}" initialMode="browse" />
}
