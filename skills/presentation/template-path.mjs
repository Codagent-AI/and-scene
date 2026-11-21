import { fileURLToPath } from 'node:url'

const [template, ...extra] = process.argv.slice(2)

if (extra.length || (template !== 'bootstrap' && template !== 'presentation')) {
  console.error('Usage: node template-path.mjs <bootstrap|presentation>')
  process.exitCode = 1
} else {
  console.log(fileURLToPath(new URL(`./templates/${template}/`, import.meta.url)))
}
