import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header><p>and-scene</p><h1>Presentations as evolving diagrams.</h1><p>Each presentation follows one scene as it changes through named steps.</p></header>
    <section aria-labelledby="presentations-heading"><h2 id="presentations-heading">Presentations</h2>
      {presentations.length ? <ul>{presentations.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`}>{title}</a></li>)}</ul> : <p>No presentations yet.</p>}
    </section>
  </main>
}
