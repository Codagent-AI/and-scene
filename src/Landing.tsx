import { presentations } from './presentations'

export default function Landing() {
  return <main data-app-landing="">
    <header><p>and-scene</p><h1>Presentations as evolving diagrams.</h1><p>One scene moves through named states, with entities that build on each other.</p></header>
    <section aria-label="Presentations">
      {presentations.length === 0 ? <p>No presentations yet.</p> : presentations.map(({ slug, title }) => <article key={slug}><h2><a href={`/${slug}`}>{title}</a></h2></article>)}
    </section>
  </main>
}
