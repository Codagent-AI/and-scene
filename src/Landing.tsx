import { presentations } from './presentations'
export function Landing() {
  return <main className="landing"><p className="eyebrow">and scene / a living canvas</p><h1>One idea.<br />An evolving scene.</h1>
    <p>Follow a thought as it takes shape. Browser presentations built from a conversation, a shared scene kit, and a little motion.</p>
    <section aria-label="Presentations">{presentations.map((p, i) => <a key={p.slug} href={`/${p.slug}`}><span>0{i + 1} / presentation</span><h2>{p.title}</h2><span>Explore the scene ↗</span></a>)}</section>
    <footer>Made for explaining things.</footer></main>
}
