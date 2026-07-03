import { useState } from 'react'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

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
  const isPassword = props.type === 'password'
  const [show, setShow] = useState(false)
  const effectiveType = isPassword ? (show ? 'text' : 'password') : props.type

  const input = (
    <input
      id={inputId}
      className={['ui-input', isPassword ? 'ui-input--with-toggle' : '', inputClassName]
        .filter(Boolean)
        .join(' ')}
      {...props}
      type={effectiveType}
    />
  )

  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')}>
      {label ? (
        <label className="ui-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      {isPassword ? (
        <div className="ui-input-wrap">
          {input}
          <button
            type="button"
            className="ui-input-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            title={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      ) : (
        input
      )}
      {hint ? <p className="ui-hint">{hint}</p> : null}
      {error ? (
        <p className="ui-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
