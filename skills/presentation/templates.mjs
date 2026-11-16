import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// Resolve from the distributed skill module, never from the caller's cwd.
export function resolveTemplate(kind) {
  if (!['bootstrap', 'presentation'].includes(kind)) throw new Error('Expected bootstrap or presentation')
  return fileURLToPath(new URL(`./templates/${kind}/`, import.meta.url))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(resolveTemplate(process.argv[2])) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
