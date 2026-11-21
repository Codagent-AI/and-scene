import { presentationPath } from './routing'
import type { PresentationEntry } from './routing'

export default function Landing({ presentations }: { presentations: readonly PresentationEntry[] }) {
  return <main className="landing">
    <h1>And Scene</h1>
    <ul>
      {presentations.map(({ slug, title }) => <li key={slug}><a href={presentationPath(slug)}>{title}</a></li>)}
    </ul>
  </main>
}
