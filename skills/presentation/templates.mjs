import { fileURLToPath, pathToFileURL } from 'node:url'

export const bootstrap = fileURLToPath(new URL('./templates/bootstrap/', import.meta.url))
export const presentation = fileURLToPath(new URL('./templates/presentation/', import.meta.url))

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify({ bootstrap, presentation }))
}
