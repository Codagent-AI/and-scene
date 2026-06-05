import { createElement, lazy, Suspense, type ComponentType } from 'react'
import { presentations } from './index'

const lazyBySlug: Record<string, ReturnType<typeof lazy<ComponentType>>> = Object.fromEntries(
  presentations.map((entry) => [entry.slug, lazy(entry.load)]),
)

export function PresentationRouter({ slug }: { slug: string }) {
  const Loader = lazyBySlug[slug]
  if (!Loader) return null

  return createElement(
    Suspense,
    {
      fallback: createElement(
        'div',
        { className: 'flex min-h-screen items-center justify-center font-mono text-sm text-gray-400' },
        'Loading presentation…',
      ),
    },
    createElement(Loader),
  )
}
