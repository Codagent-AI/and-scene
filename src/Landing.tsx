import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header className="landing-intro">
      <p className="landing-eyebrow">And Scene</p>
      <h1>Presentations as evolving scenes.</h1>
      <p>One shared diagram can move through an idea, step by step. Choose a presentation to begin.</p>
    </header>
    {presentations.length > 0 ? <section className="landing-list" aria-label="Presentations">{presentations.map(({ slug, title }) => <a className="landing-link" key={slug} href={`/${slug}`}><span>{title}</span><span aria-hidden="true">↗</span></a>)}</section> : <p className="landing-empty">No presentations have been added yet.</p>}
  </main>
}
