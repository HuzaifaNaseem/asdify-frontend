export function Spinner({ label = 'Loading…' }) {
  return (
    <span className="ui-spinner" aria-busy="true" aria-live="polite">
      <span className="ui-spinner__dot" aria-hidden="true" />
      {label ? <span className="ui-spinner__label">{label}</span> : null}
    </span>
  )
}
