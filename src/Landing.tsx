import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing">
    <header className="landing-intro"><p className="landing-eyebrow">and-scene</p><h1>Presentations as evolving diagrams.</h1><p>One scene moves through named states. Choose a presentation to explore it.</p></header>
    <section className="landing-list" aria-label="Presentations">
      {presentations.length ? presentations.map(({ slug, title }) => <a className="landing-link" href={`/${slug}`} key={slug}>{title}<span aria-hidden="true">→</span></a>) : <p className="landing-empty">No presentations yet.</p>}
    </section>
  </main>
}
