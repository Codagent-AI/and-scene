import { presentations } from './presentations'

export default function Landing() {
  return (
    <main className="landing" data-presentation-landing>
      <p className="landing__eyebrow">and-scene</p>
      <h1>Presentations as evolving scenes.</h1>
      <p className="landing__summary">Choose a presentation to explore one idea changing state over time.</p>
      {presentations.length > 0 ? (
        <nav className="landing__list" aria-label="Presentations">
          {presentations.map((presentation) => <a key={presentation.slug} href={`/${presentation.slug}`}>{presentation.title}</a>)}
        </nav>
      ) : <p className="landing__empty">No presentations have been registered yet.</p>}
    </main>
  )
}
