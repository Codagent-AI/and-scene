export function browserErrors(page) {
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  return errors
}
export function verificationFailure(phase, index, error) {
  return `FAIL verification phase=${phase} step=${index}: ${error.message}`
}
