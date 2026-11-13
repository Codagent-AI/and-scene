import { presentations } from './presentations'
export function Landing(){return <main><h1>Presentations</h1><nav aria-label="Presentations">{presentations.map(p=><a key={p.slug} href={`/${p.slug}`}>{p.title}</a>)}</nav></main>}
