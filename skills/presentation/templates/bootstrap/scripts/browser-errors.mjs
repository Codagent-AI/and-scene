export function watchBrowserErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return () => {
    if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  }
}
