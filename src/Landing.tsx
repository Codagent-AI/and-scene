import { Link } from './LandingLink'
import { presentations } from './presentations'
import './App.css'

export default function Landing() {
  return (
    <main className="shell" data-presentation-landing>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">and-scene</p>
        <h1 id="page-title">Presentations as evolving diagrams.</h1>
        <p className="summary">A home for browser-based presentations that develop one scene through named states.</p>
      </section>
      <section className="beats" aria-label="Available presentations">
        {presentations.length === 0 ? <p className="summary">No presentations have been registered yet.</p> : presentations.map((presentation) => <article className="beat" key={presentation.slug}><h2><Link href={`/${presentation.slug}`}>{presentation.title}</Link></h2></article>)}
      </section>
    </main>
  )
}
