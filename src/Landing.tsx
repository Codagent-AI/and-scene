import { Link } from './router'
import { presentations } from './presentations'
import './App.css'

export default function Landing() {
  return <main className="shell" data-landing="true">
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">and-scene</p>
      <h1 id="page-title">Presentations as evolving diagrams.</h1>
      <p className="summary">A small, reusable scene engine for browser-based presentations where each step changes one shared composition.</p>
    </section>
    <section className="beats" aria-label="Presentations">
      {presentations.length ? presentations.map((presentation) => <Link className="beat" key={presentation.slug} href={`/${presentation.slug}`}><span className="beat-number">open</span><h2>{presentation.title}</h2><p>Explore this evolving scene.</p></Link>) : <p className="summary">No presentations have been registered yet.</p>}
    </section>
  </main>
}
