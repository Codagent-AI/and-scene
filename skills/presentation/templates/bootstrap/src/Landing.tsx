import { presentations } from './presentations'
export default function Landing() { return <main><h1>And Scene</h1><p>Presentations made to move.</p>{presentations.map(p => <p key={p.slug}><a href={`/${p.slug}`}>{p.title}</a></p>)}</main> }
