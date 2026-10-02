import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing>
    <p className="landing__eyebrow">and-scene</p>
    <h1>Presentations as evolving diagrams.</h1>
    <p className="landing__summary">A presentation is one scene moving through named states, with stable entities that evolve as the story unfolds.</p>
    {presentations.length > 0 ? <nav className="landing__list" aria-label="Presentations">{presentations.map(({ slug, title }) => <a className="landing__link" key={slug} href={`/${slug}`} data-presentation-link>{title}<span aria-hidden="true"> →</span></a>)}</nav> : <p className="landing__empty">No presentations have been registered yet.</p>}
  </main>
}
