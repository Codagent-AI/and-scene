import { presentations } from './presentations'
export default function Landing() { return <main><h1>Presentations</h1>{presentations.map(p => <a key={p.slug} href={`/${p.slug}`}>{p.title}</a>)}</main> }
