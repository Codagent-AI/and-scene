import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header className="landing-intro">
      <p>And Scene</p>
      <h1>Presentations as evolving diagrams.</h1>
      <p>Each presentation follows one scene as it changes through a story.</p>
    </header>
    <section className="landing-list" aria-labelledby="presentation-list-title">
      <h2 id="presentation-list-title">Presentations</h2>
      {presentations.length === 0
        ? <p data-presentation-empty="">No presentations have been added yet.</p>
        : <ul>{presentations.map((presentation) => <li key={presentation.slug}><a href={`/${presentation.slug}`}>{presentation.title}</a></li>)}</ul>}
    </section>
  </main>
}
