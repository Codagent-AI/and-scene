# Presentation scaffold

npm ci; npx playwright install chromium; npm run verify

Replace the unstyled example with presentation-owned CSS and content. The kit and
bootstrap impose no visual defaults. Register every new folder explicitly in
src/presentations/index.ts. npm run verify -- --slug=your-slug checks any route.
The project-local npm run inspect -- your-slug captures settled advisory artifacts.
