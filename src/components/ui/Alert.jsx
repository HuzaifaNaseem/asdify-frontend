export function Alert({ title, variant = 'info', children }) {
  return (
    <div className={['ui-alert', `ui-alert--${variant}`].join(' ')} role={variant === 'error' ? 'alert' : 'status'}>
      {title ? <strong className="ui-alert__title">{title}</strong> : null}
      <div className="ui-alert__body">{children}</div>
    </div>
  )
}
