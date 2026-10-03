import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header><p>and-scene</p><h1>Presentations as evolving diagrams.</h1><p>One scene moves through named states, with stable entities that evolve over time.</p></header>
    <section aria-labelledby="presentations-heading"><h2 id="presentations-heading">Presentations</h2>
      {presentations.length ? <ul>{presentations.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul> : <p data-presentation-empty="">No presentations yet.</p>}
    </section>
  </main>
}
