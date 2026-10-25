import { presentations } from './presentations'
export function Landing() { return <main><h1>Presentations</h1>{presentations.map(entry => <a key={entry.slug} href={`/${entry.slug}`}>{entry.title}</a>)}</main> }
