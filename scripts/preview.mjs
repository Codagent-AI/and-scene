// Vite colorizes its ready banner, so escape codes can land between the host and
// the port ("127.0.0.1:<bold>4173"). Strip them before matching the served URL.
export function previewStarted(output, port = 4173) {
  return new RegExp(`http://127\\.0\\.0\\.1:${port}(\\D|$)`).test(output.replace(/\u001b\[[0-9;]*m/g, ''))
}
