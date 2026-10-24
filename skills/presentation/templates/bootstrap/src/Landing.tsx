import { presentations } from './presentations'
export default function Landing() { return <main><h1>Presentations</h1>{presentations.map(entry => <p key={entry.slug}><a href={`/${entry.slug}`}>{entry.title}</a></p>)}</main> }
