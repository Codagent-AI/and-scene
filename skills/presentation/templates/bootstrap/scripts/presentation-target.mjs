export function resolvePresentationSlug(args) {
  return args.find((argument) => !argument.startsWith('--')) || 'starter'
}

export function isPresentationRegistered(registry, slug) {
  return registry.includes(`slug: '${slug}'`) || registry.includes(`slug: "${slug}"`)
}
