import { presentations } from './presentations'

export function Landing() {
  return <main data-host-landing>
    <header><p>and-scene</p><h1>Presentations as evolving diagrams.</h1><p>One scene moves through named states as the explanation develops.</p></header>
    <section aria-label="Presentations">
      {presentations.length === 0 ? <p>No presentations yet.</p> : <ul>{presentations.map(item => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul>}
    </section>
  </main>
}
