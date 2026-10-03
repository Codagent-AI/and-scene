import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header><p>And Scene</p><h1>Presentations as evolving diagrams.</h1>
      <p>Each presentation is one scene moving through named states.</p></header>
    <section aria-label="Presentations">
      {presentations.length ? <ul>{presentations.map((entry) => <li key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}</a></li>)}</ul> : <p data-presentation-empty="">No presentations yet.</p>}
    </section>
  </main>
}
