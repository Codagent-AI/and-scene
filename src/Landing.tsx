import { presentations } from './presentations'

export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <header className="landing__header"><p className="landing__eyebrow">And Scene</p><h1>Presentations as evolving diagrams.</h1><p>One scene moves through named states as an explanation develops.</p></header>
    <section className="landing__presentations" aria-labelledby="presentations-title">
      <h2 id="presentations-title">Presentations</h2>
      {presentations.length === 0 ? <p data-presentation-empty="">No presentations yet.</p> : <ul>{presentations.map(item => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul>}
    </section>
  </main>
}
