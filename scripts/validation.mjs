export function assertReference(actual, expected) {
  const content = rows => rows.map(({ era, title, caption }) => ({ era, title, caption }))
  if (!Array.isArray(actual) || JSON.stringify(content(actual)) !== JSON.stringify(content(expected))) throw new Error('Reference sample metadata must match the normative nine-step order')
}
