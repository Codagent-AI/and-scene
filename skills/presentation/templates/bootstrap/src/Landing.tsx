import { Sparkles } from 'lucide-react'
import { presentations } from './presentations'

export function Landing() {
  return (
    <main className="relative min-h-screen px-6 py-16 font-mono md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.25em] text-amber">and-scene</p>
        <h1 className="mt-4 text-3xl text-gray-100 md:text-4xl">
          Presentations as evolving diagrams.
        </h1>
        <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-gray-300">
          One shared canvas holds the talk together. Each step changes positions,
          labels, focus, or connections while the audience follows one idea as it
          develops.
        </p>

        <section className="mt-12" aria-labelledby="presentations-heading">
          <h2 id="presentations-heading" className="text-sm uppercase tracking-[0.2em] text-cyan">
            Presentations
          </h2>
          {presentations.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-gray-400">
              No presentations registered yet. Add one under{' '}
              <code className="text-gray-300">src/presentations/</code> and register
              it in <code className="text-gray-300">index.ts</code>.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {presentations.map((entry) => (
                <li key={entry.slug}>
                  <a
                    href={`/${entry.slug}`}
                    className="group flex items-center gap-3 border border-cyan/20 bg-bg/60 px-4 py-3 transition-colors hover:border-cyan/50"
                  >
                    <Sparkles
                      size={18}
                      className="text-amber transition-colors group-hover:text-cyan"
                      aria-hidden
                    />
                    <span className="text-gray-100">{entry.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
