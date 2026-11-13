import { cp, mkdtemp, symlink } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { expect } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
export const exec = promisify(execFile)
export async function copyApp(prefix: string) {
 const directory=await mkdtemp(path.join(tmpdir(),`and-scene-${prefix}-`))
 for(const file of ['src','scripts','package.json','package-lock.json','index.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json'])await cp(file,path.join(directory,file),{recursive:true})
 await symlink(path.resolve('node_modules'),path.join(directory,'node_modules'),'dir')
 return directory
}
export function assertCleanup(output: string) {
 for(const match of output.matchAll(/preview: http:\/\/127\.0\.0\.1:\d+ pid=(\d+)/g)) {
  expect(output).toContain(`cleanup: preview pid=${match[1]} stopped`)
  expect(()=>process.kill(Number(match[1]),0)).toThrow()
 }
}
