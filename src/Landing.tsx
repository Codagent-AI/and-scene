import { presentations } from './presentations'
export default function Landing() {
  return <main className="landing" data-presentation-landing="">
    <p>and-scene</p><h1>Presentations as evolving diagrams.</h1>
    <p>One scene moves through named states as its ideas develop.</p>
    <nav aria-label="Presentations">{presentations.length ? presentations.map(item => <a key={item.slug} href={`/${item.slug}`}>{item.title}</a>) : <p>No presentations yet.</p>}</nav>
  </main>
}
