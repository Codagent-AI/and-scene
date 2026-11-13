import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readdir, readFile, mkdir, copyFile, access, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
export const templateRoot = fileURLToPath(new URL('../templates/bootstrap/',import.meta.url))
async function exists(file) {try {await access(file);return true}catch{return false}}
export async function filesUnder(root, prefix='') {
 const result=[]
 for(const entry of await readdir(path.join(root,prefix),{withFileTypes:true})) {
  const relative=path.join(prefix,entry.name)
  if(entry.isDirectory())result.push(...await filesUnder(root,relative));else result.push(relative)
 }
 return result
}
export function anchorFor(file) {
 if(file.startsWith('src/presentation-kit/'))return 'kit'
 if(file.startsWith('src/presentations/')||file==='src/Landing.tsx'||file==='src/main.tsx')return 'index'
 return 'build'
}
export async function scaffold(target,{missing=['build','kit','index'],confirmed=false,install=true,verifySlug}={}) {
 if(missing.some(anchor=>!['build','kit','index'].includes(anchor)))throw new Error('scaffold: unknown anchor')
 const nonempty=await exists(target)&&(await readdir(target)).length>0
 if(nonempty&&!confirmed)throw new Error(`scaffold: confirmation required before writing ${target}`)
 const manifest=path.join(target,'package.json')
 const previous=await exists(manifest)?JSON.parse(await readFile(manifest,'utf8')):{}
 if(verifySlug!==undefined&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(verifySlug))throw new Error('scaffold: invalid verification slug')
 if(!missing.includes('index')&&!previous.scripts?.verify&&!verifySlug)throw new Error('scaffold: select a registered route with verifySlug when preserving the index')
 await mkdir(target,{recursive:true})
 const copied=[],preserved=[]
 const fresh=!nonempty&&missing.length===3
 for(const file of await filesUnder(templateRoot)) {
  if(file==='package.json'||file==='package-lock.json'||(!missing.includes(anchorFor(file))&&!file.startsWith('scripts/')))continue
  const destination=path.join(target,file)
  if(await exists(destination)){preserved.push(file);continue}
  await mkdir(path.dirname(destination),{recursive:true});await copyFile(path.join(templateRoot,file),destination);copied.push(file)
 }
 const required=JSON.parse(await readFile(path.join(templateRoot,'package.json'),'utf8'))
 if(verifySlug)required.scripts.verify=`node scripts/verify.mjs ${verifySlug}`
 const merged={...required,...previous,scripts:{...required.scripts,...previous.scripts},dependencies:{...required.dependencies,...previous.dependencies},devDependencies:{...required.devDependencies,...previous.devDependencies}}
 await writeFile(manifest,JSON.stringify(merged,null,2)+'\n')
 if(fresh)await copyFile(path.join(templateRoot,'package-lock.json'),path.join(target,'package-lock.json'))
 if(install){const child=spawn('npm',[fresh?'ci':'install'],{cwd:target,stdio:'inherit'});const [code]=await once(child,'exit');if(code!==0)throw new Error(`scaffold: dependency installation exited ${code}`)}
 return {target,copied,preserved}
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const target=process.argv[2]
 if(!target)throw new Error('scaffold: target required')
 const missing=process.argv.find(arg=>arg.startsWith('--missing='))?.split('=')[1].split(',')
 scaffold(path.resolve(target),{missing,confirmed:process.argv.includes('--confirmed'),verifySlug:process.argv.find(arg=>arg.startsWith('--verify-slug='))?.slice('--verify-slug='.length)}).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1})
}
