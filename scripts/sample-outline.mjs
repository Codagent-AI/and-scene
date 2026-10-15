import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

export const referenceOutline = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

export async function validateRegistration(root, slug) {
  const fail = (message) => { throw new Error(`[sample] ${message}`) }
  const registryPath = path.join(root, 'src/presentations/index.ts')
  const registry = await readFile(registryPath, 'utf8').catch(() => fail('presentation registry missing'))
  const ts = createRequire(path.join(root, 'package.json'))('typescript')
  const source = ts.createSourceFile(registryPath, registry, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const declaration = source.statements.find((statement) => ts.isVariableStatement(statement) && statement.declarationList.declarations.some((item) => ts.isIdentifier(item.name) && item.name.text === 'presentations'))
  const registryArray = declaration?.declarationList.declarations.find((item) => ts.isIdentifier(item.name) && item.name.text === 'presentations')?.initializer
  const registered = registryArray && ts.isArrayLiteralExpression(registryArray) && registryArray.elements.some((entry) => {
    if (!ts.isObjectLiteralExpression(entry)) return false
    const properties = new Map(entry.properties.filter(ts.isPropertyAssignment).map((property) => [property.name.getText(source).replaceAll(/["']/g, ''), property.initializer]))
    const slugValue = properties.get('slug')
    const loadValue = properties.get('load')
    return slugValue && ts.isStringLiteral(slugValue) && slugValue.text === slug && loadValue && ts.isArrowFunction(loadValue) && ts.isCallExpression(loadValue.body) && loadValue.body.expression.kind === ts.SyntaxKind.ImportKeyword && loadValue.body.arguments[0] && ts.isStringLiteral(loadValue.body.arguments[0]) && loadValue.body.arguments[0].text === `./${slug}/Talk`
  })
  if (!registered || source.parseDiagnostics.length) throw new Error(`registry does not register ${slug} as a presentation entry`)
}

export async function validateSample(root, slug = 'how-to-make-a-presentation') {
  const fail = (message) => { throw new Error(`[sample] ${message}`) }
  const sampleDir = path.join(root, 'src/presentations', slug)
  await access(sampleDir).catch(() => fail(`sample directory missing: ${slug}`))
  await validateRegistration(root, slug).catch((error) => fail(error.message.replace(/^\[sample\] /, '')))
  const outline = await readFile(path.join(sampleDir, 'steps/index.tsx'), 'utf8').catch(() => fail('sample outline missing'))
  let cursor = 0
  for (let index = 0; index < referenceOutline.length; index++) {
    for (const value of referenceOutline[index]) {
      const encoded = JSON.stringify(value).slice(1, -1)
      const at = outline.indexOf(encoded, cursor)
      if (at < 0) fail(`step ${index + 1} missing or out of order: ${value}`)
      cursor = at + encoded.length
    }
  }
}
