import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Copies this repository into a fresh temp directory (skipping installed
 * dependencies, build output, screenshots, and git metadata) and links the
 * installed `node_modules`, so the copy can build and preview without a real
 * `npm install`.
 */
export function copyRepoWithLinkedModules(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  fs.cpSync(REPO_ROOT, dir, {
    recursive: true,
    filter: (src) => !/^(node_modules|dist|screenshots|\.git)(\/|$)/.test(path.relative(REPO_ROOT, src)),
  })
  fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return dir
}
