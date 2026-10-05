import ts from 'typescript'

/** Read the explicit presentation registry without depending on quote style or whitespace. */
export function parsePresentationRegistry(source, fileName = 'src/presentations/index.ts') {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const presentations = []
  const errors = []
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === 'presentations' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      for (const entry of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(entry)) { errors.push('registry entries must be object literals'); continue }
        const fields = new Map(entry.properties.filter(ts.isPropertyAssignment).map((property) => [property.name.getText(sourceFile).replaceAll(/["']/g, ''), property.initializer]))
        const slug = fields.get('slug')
        const title = fields.get('title')
        const load = fields.get('load')
        if (!slug || !(ts.isStringLiteral(slug) || ts.isNoSubstitutionTemplateLiteral(slug)) || !title || !(ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title)) || !load) {
          errors.push(`invalid presentation registration: ${entry.getText(sourceFile)}`)
          continue
        }
        presentations.push({ slug: slug.text, title: title.text })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  if (!presentations.length) errors.push('registry contains no presentations')
  const seen = new Set()
  for (const { slug } of presentations) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push(`invalid presentation slug: ${slug}`)
    if (seen.has(slug)) errors.push(`duplicate presentation slug: ${slug}`)
    seen.add(slug)
  }
  if (errors.length) throw new Error(`registry check failed: ${errors.join('; ')}`)
  return presentations
}
