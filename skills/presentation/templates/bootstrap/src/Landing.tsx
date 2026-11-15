import { presentations } from './presentations'
export default function Landing() { return <main><h1>Presentations</h1>{presentations.map(p => <p key={p.slug}><a href={'/' + p.slug}>{p.title}</a></p>)}</main> }
