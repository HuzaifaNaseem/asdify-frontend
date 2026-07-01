export function Input({
  id,
  label,
  hint,
  error,
  className = '',
  inputClassName = '',
  ...props
}) {
  const inputId = id ?? props.name
  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')}>
      {label ? (
        <label className="ui-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input id={inputId} className={['ui-input', inputClassName].filter(Boolean).join(' ')} {...props} />
      {hint ? <p className="ui-hint">{hint}</p> : null}
      {error ? (
        <p className="ui-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
