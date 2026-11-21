import assert from 'node:assert/strict'
import path from 'node:path'
import ts from 'typescript'

export const structuralStyles = new Set([
  'alignItems', 'bottom', 'display', 'gridTemplateColumns', 'gridTemplateRows', 'height', 'inset',
  'justifyItems', 'justifySelf', 'left', 'minHeight', 'minWidth', 'overflow', 'overflowX',
  'overflowY', 'placeItems', 'position', 'right', 'textOverflow', 'top', 'touchAction',
  'transform', 'transformOrigin', 'whiteSpace', 'width',
])

export function assertStyleNeutralSource(relative, source) {
  const file = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true)

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const imported = node.moduleSpecifier.text
      if (/\.(css|less|sass|scss|styl)(?:[?#]|$)/i.test(imported)) {
        assert.ok(relative === 'main.tsx' && imported === './index.css', `${relative}: unexpected stylesheet ${imported}`)
      }
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      assert.notEqual(node.tagName.getText(file), 'style', `${relative}: embedded CSS`)
    }
    if (ts.isJsxAttribute(node) && node.name.getText(file) === 'style') {
      const value = node.initializer
      const expression = value && ts.isJsxExpression(value) && value.expression
      assert.ok(expression && ts.isObjectLiteralExpression(expression), `${relative}: inline defaults must be explicit`)
      for (const property of expression.properties) {
        if (ts.isSpreadAssignment(property)) {
          assert.ok(path.basename(relative) === 'SceneLayer.tsx' && property.expression.getText(file) === 'style',
            `${relative}: unexpected inline style spread`)
          continue
        }
        const name = property.name
        const key = name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : undefined
        assert.ok(structuralStyles.has(key), `${relative}: visual inline default ${property.getText(file)}`)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(file)
}
