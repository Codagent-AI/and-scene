import { PRESENTATIONS } from './presentations/index.ts'
import type { PresentationEntry } from './presentations/index.ts'

export default function Landing({ entries = PRESENTATIONS }: { entries?: readonly PresentationEntry[] }) {
  return (
    <main data-landing="">
      <h1>And Scene</h1>
      <ul>
        {entries.map((e) => (
          <li key={e.slug}>
            <a href={`/${e.slug}`}>{e.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
