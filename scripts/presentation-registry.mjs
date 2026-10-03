import ts from 'typescript'

export function readPresentationSlugs(source) {
  const file = ts.createSourceFile('src/presentations/index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const slugs = []
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'presentations' || !declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) continue
      for (const entry of declaration.initializer.elements) {
        if (!ts.isObjectLiteralExpression(entry)) continue
        let slug
        let hasLoader = false
        for (const property of entry.properties) {
          if (!ts.isPropertyAssignment(property)) continue
          const name = property.name
          const propertyName = ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined
          if (propertyName === 'slug' && ts.isStringLiteral(property.initializer)) slug = property.initializer.text
          if (propertyName === 'load' && (ts.isArrowFunction(property.initializer) || ts.isFunctionExpression(property.initializer))) hasLoader = true
        }
        if (slug && hasLoader) slugs.push(slug)
      }
    }
  }
  return slugs
}
