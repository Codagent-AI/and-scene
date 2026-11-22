export const presentations = [{
  slug: 'how-to-make-a-presentation',
  title: 'How to Use This Skill to Make a Presentation',
  load: () => import('./how-to-make-a-presentation/Talk'),
}]
export function findPresentation(pathname: string) {
  return presentations.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
}
