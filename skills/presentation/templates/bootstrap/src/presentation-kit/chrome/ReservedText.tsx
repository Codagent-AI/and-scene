export function ReservedText({ text, choices }: { text: string; choices: readonly string[] }) {
  return <>
    <span data-presentation-text="">{text}</span>
    {[...new Set(choices)].map(choice => (
      <span key={choice} aria-hidden="true" data-presentation-reserve={choice} />
    ))}
  </>
}
