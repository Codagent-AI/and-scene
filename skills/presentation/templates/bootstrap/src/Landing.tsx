import { presentations } from './presentations'
export default function Landing() {
  return <main data-presentation-landing>
    <header><p>And Scene</p><h1>Presentations as evolving scenes</h1><p>Move through ideas as one diagram changes over time.</p></header>
    <section aria-label="Presentations">{presentations.map(({ slug, title }) => <article key={slug}><h2><a href={`/${slug}`}>{title}</a></h2><p>Open presentation</p></article>)}</section>
  </main>
}
