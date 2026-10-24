// What `npm run verify` expects of the reference presentation. The outline is
// optional; without it verify still checks the build, registration, and render.
export default {
  slug: 'starter',
  title: 'Starter presentation',
  stepsModule: '/src/presentations/starter/steps/index.ts',
  stepsExport: 'STEPS',
  outline: null,
}
