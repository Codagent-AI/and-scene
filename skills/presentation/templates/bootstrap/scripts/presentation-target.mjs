import ts from 'typescript'

export function resolvePresentationSlug(args) {
  const slug = args.find((argument) => !argument.startsWith('--')) || 'starter'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('invalid presentation slug')
  }
  return slug
}

function unwrapExpression(expression) {
  if (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return unwrapExpression(expression.expression)
  }
  return expression
}

function registryArray(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'presentationRegistry' || !declaration.initializer) continue
      const initializer = unwrapExpression(declaration.initializer)
      if (ts.isArrayLiteralExpression(initializer)) return initializer
    }
  }
  return null
}

function propertyName(property) {
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) return property.name.text
  return null
}

export function isPresentationRegistered(registry, slug) {
  const sourceFile = ts.createSourceFile('presentations/index.ts', registry, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const entries = registryArray(sourceFile)
  if (!entries) return false

  return entries.elements.some((element) => {
    const entry = unwrapExpression(element)
    if (!ts.isObjectLiteralExpression(entry)) return false
    const property = entry.properties.find((candidate) => ts.isPropertyAssignment(candidate) && propertyName(candidate) === 'slug')
    if (!property || !ts.isPropertyAssignment(property)) return false
    const value = unwrapExpression(property.initializer)
    return ts.isStringLiteralLike(value) && value.text === slug
  })
}
