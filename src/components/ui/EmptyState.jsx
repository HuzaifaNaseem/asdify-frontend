export function EmptyState({ title, description, action }) {
  return (
    <div className="ui-empty">
      <h2 className="ui-empty__title">{title}</h2>
      {description ? <p className="ui-empty__desc">{description}</p> : null}
      {action ? <div className="ui-empty__actions">{action}</div> : null}
    </div>
  )
}
