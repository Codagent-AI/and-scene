import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const templateRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../templates/bootstrap');
export function resolveTarget(project, existingApp = false) {
  if (existingApp) return project;
  let workspaces = false;
  const pkg = join(project, 'package.json');
  if (existsSync(pkg)) workspaces = Boolean(JSON.parse(readFileSync(pkg, 'utf8')).workspaces);
  return !existingApp && (workspaces || ['pnpm-workspace.yaml', 'packages', 'apps'].some(p => existsSync(join(project,p)))) ? join(project, 'presentations') : project;
}
function files(dir, prefix = '') {
  return readdirSync(dir, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(join(dir,entry.name), join(prefix,entry.name)) : [join(prefix,entry.name)]);
}
export function scaffold(project, {write=false, confirmed=false, anchors=['build','kit','index'], existingApp=false} = {}) {
  if (anchors.some(a => !['build','kit','index'].includes(a))) throw Error('Unknown scaffold anchor');
  const target = resolveTarget(resolve(project),existingApp);
  const selected = files(templateRoot).filter(p => anchors.includes(p.startsWith('src/presentation-kit/') ? 'kit' : p.startsWith('src/presentations/') || p === 'src/main.tsx' || p === 'src/Landing.tsx' ? 'index' : 'build'));
  if (!write) return {target,files:selected};
  if (existsSync(project) && readdirSync(project).length && !confirmed) throw Error('Non-empty project: state target and obtain confirmation first');
  for (const p of selected) if (existsSync(join(target,p))) throw Error(`Preserve existing file: ${p}; integrate missing anchors explicitly`);
  for (const p of selected) {mkdirSync(dirname(join(target,p)),{recursive:true});copyFileSync(join(templateRoot,p),join(target,p));}
  return {target,files:selected};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {console.log(JSON.stringify(scaffold(process.argv[2] || '.', {write:process.argv.includes('--write'),confirmed:process.argv.includes('--confirmed'),existingApp:process.argv.includes('--existing-app'),anchors:process.argv.find(a=>a.startsWith('--anchors='))?.split('=')[1].split(',') || undefined}),null,2));}
  catch(error) {console.error(error.message);process.exitCode=1;}
}
