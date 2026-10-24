import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Project root: the parent of `scripts/`, independent of the caller's working directory. */
export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * `verify.config.json` lists the routes to verify; a route may carry the
 * normative `outline` ([{ era, title, caption }]) its rendered steps must match.
 */
export async function readConfig(root = projectRoot) {
  const config = JSON.parse(await readFile(path.join(root, 'verify.config.json'), 'utf8'))
  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new Error('verify.config.json must list at least one route')
  }
  return config
}
