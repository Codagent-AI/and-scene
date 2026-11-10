/** @param {unknown} slug */
export function presentationSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(slug)) throw new Error('Invalid presentation slug: expected a safe route segment')
  return slug
}
