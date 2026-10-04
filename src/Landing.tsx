import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-landing="">
    <header className="landing__intro">
      <p className="landing__eyebrow">and-scene</p>
      <h1>Presentations as evolving diagrams.</h1>
      <p>This is a home for browser presentations built around one scene moving through named states.</p>
    </header>
    <section className="landing__presentations" aria-labelledby="presentations-title">
      <h2 id="presentations-title">Presentations</h2>
      {presentations.length === 0 ? <p data-presentation-empty="">No presentations yet.</p> : <ul>
        {presentations.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`} data-presentation-link="">{title}</a></li>)}
      </ul>}
    </section>
  </main>
}
