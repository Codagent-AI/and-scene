import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing">
    <header className="landing-header"><p>And Scene</p><h1>Presentations as evolving diagrams.</h1><p>One scene moves through named states as an explanation develops.</p></header>
    <section aria-labelledby="presentations-heading" className="landing-list">
      <h2 id="presentations-heading">Presentations</h2>
      {presentations.length ? <ul>{presentations.map(({ slug, title }) => <li key={slug}><a href={`/${slug}`}>{title}</a></li>)}</ul> : <p>No presentations yet.</p>}
    </section>
  </main>
}
