import { resolve } from 'node:path'
import { createServer } from 'vite'

export async function loadReferenceSteps(root = process.cwd()) {
  const vite = await createServer({
    root,
    configFile: resolve(root, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })
  try {
    const reference = await vite.ssrLoadModule('/src/presentations/how-to-make-a-presentation/steps.tsx')
    return reference.steps
  } finally {
    await vite.close()
  }
}
