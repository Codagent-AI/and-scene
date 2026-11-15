import { readdir, mkdir, copyFile, access } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
export const templateRoot = fileURLToPath(new URL('../templates/bootstrap/', import.meta.url))
export async function materialize(target) {
  const files = []
  async function walk(dir, prefix = '') {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const relative = join(prefix, item.name)
      if (item.isDirectory()) await walk(join(dir, item.name), relative)
      else files.push(relative)
    }
  }
  await walk(templateRoot)
  for (const file of files) {
    try { await access(join(target, file)) } catch { continue }
    throw new Error(`Refusing to overwrite ${join(target, file)}`)
  }
  for (const file of files) {
    const dest = join(target, file)
    await mkdir(resolve(dest, '..'), { recursive: true })
    await copyFile(join(templateRoot, file), dest)
  }
  return files
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) { console.error('Usage: materialize.mjs <target>'); process.exitCode = 1 }
  else materialize(resolve(process.argv[2])).then(files => console.log(`Materialized ${files.length} files`)).catch(error => { console.error(error.message); process.exitCode = 1 })
}
