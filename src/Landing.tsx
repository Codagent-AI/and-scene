import { presentations } from './presentations/index.ts'
import './App.css'

export default function Landing() {
  return <main className="shell">
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">and-scene</p>
      <h1 id="page-title">Presentations as evolving diagrams.</h1>
      <p className="summary">Each presentation is one scene moving through named states.</p>
    </section>
    <section className="beats" aria-label="Presentations">
      {presentations.length ? presentations.map(({ slug, title }) => <article className="beat" key={slug}>
        <h2><a href={`/${slug}`}>{title}</a></h2>
      </article>) : <p>No presentations have been registered yet.</p>}
    </section>
  </main>
}
