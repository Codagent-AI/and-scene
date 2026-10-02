import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header className="landing-header"><p>and-scene</p><h1>Presentations as evolving scenes.</h1><p>Each presentation follows one diagram as its ideas develop.</p></header>
    <section className="landing-list" aria-label="Presentations">
      {presentations.length === 0 ? <p className="landing-empty">No presentations have been added yet.</p> : presentations.map(({ slug, title }) => <a className="landing-link" href={`/${slug}`} key={slug}>{title}<span aria-hidden="true">→</span></a>)}
    </section>
  </main>
}
