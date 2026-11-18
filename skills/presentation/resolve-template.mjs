import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
export function resolveTemplate(name) {
  if (!['bootstrap', 'presentation'].includes(name)) throw new Error('Template must be bootstrap or presentation')
  return resolve(dirname(fileURLToPath(import.meta.url)), 'templates', name)
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { console.log(resolveTemplate(process.argv[2])) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
