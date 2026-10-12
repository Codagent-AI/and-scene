import { presentations } from './presentations'
export function Landing() { return <main><h1>Presentations</h1>{presentations.length ? <ul>{presentations.map((item) => <li key={item.slug}><a href={`/${item.slug}`}>{item.title}</a></li>)}</ul> : <p>Add a presentation to get started.</p>}</main> }
