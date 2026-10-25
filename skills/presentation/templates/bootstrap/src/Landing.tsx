import type { RegistryEntry } from './presentations'
export function Landing({ entries }: { entries: readonly RegistryEntry[] }) {
 return <main className="landing"><p className="eyebrow">AND SCENE / A COLLECTION OF EXPLANATIONS</p><h1>One scene.<br /><em>A story unfolding.</em></h1><p>Follow an idea as it takes shape. No slide changes. Just a diagram that grows with the story.</p><div className="presentation-list">{entries.map((p, i) => <a data-presentation-route={p.slug} key={p.slug} href={`/${p.slug}`}><span>0{i + 1}</span><strong>{p.title}</strong><span>Explore ↗</span></a>)}</div><small>Built for curiosity. Made with and-scene.</small></main>
}
