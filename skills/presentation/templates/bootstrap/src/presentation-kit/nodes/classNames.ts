export function withBaseClass(baseClass: string, className?: unknown) {
  return className ? `${baseClass} ${className}` : baseClass
}
