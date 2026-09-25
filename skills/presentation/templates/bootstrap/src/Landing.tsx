import { presentations } from './presentations/index.ts'

export default function Landing() {
  return <main data-presentation-landing>
    <h1>And Scene</h1>
    <p>Browser presentations built as one evolving scene.</p>
    <nav aria-label="Presentations">{presentations.length ? presentations.map((item) => <a key={item.slug} href={`/${item.slug}`}>{item.title}</a>) : <p data-presentation-empty>No presentations yet.</p>}</nav>
  </main>
}
