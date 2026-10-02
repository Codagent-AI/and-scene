import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { preview } from 'vite'

/** Read the explicit registry as TypeScript syntax; comments and unrelated objects are ignored. */
export async function registeredSlugs(registryPath) {
  const filePath = registryPath instanceof URL ? fileURLToPath(registryPath) : registryPath
  const source = await readFile(filePath, 'utf8')
  const file = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let declaration
  const findRegistry = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'presentations') declaration = node
    ts.forEachChild(node, findRegistry)
  }
  findRegistry(file)
  if (!declaration || !declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) {
    throw new Error(`presentation registry must export an explicit presentations array: ${filePath}`)
  }
  const slugs = []
  for (const item of declaration.initializer.elements) {
    if (!ts.isObjectLiteralExpression(item)) continue
    const property = item.properties.find((member) => ts.isPropertyAssignment(member) &&
      ((ts.isIdentifier(member.name) && member.name.text === 'slug') || (ts.isStringLiteral(member.name) && member.name.text === 'slug')))
    if (!property || !ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer)) {
      throw new Error(`every presentation registry entry needs a literal slug (${item.getText(file)})`)
    }
    slugs.push(property.initializer.text)
  }
  return slugs
}

/** Start Vite's production preview on an OS-assigned port to avoid shared-port races. */
export async function startPreview() {
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') {
    server.httpServer.closeAllConnections?.()
    await new Promise((resolve) => server.httpServer.close(resolve))
    throw new Error('Vite preview did not expose its assigned TCP port')
  }
  return {
    server,
    host: '127.0.0.1',
    port: address.port,
    close: () => new Promise((resolve) => {
      server.httpServer.closeAllConnections?.()
      server.httpServer.close(() => resolve())
    }),
  }
}
