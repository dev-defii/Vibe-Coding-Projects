import { useState } from 'react'
import { DESCRIPTION_MAX, TITLE_MAX, validateTask } from '../validation'

export default function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
  })
  const [errors, setErrors] = useState({})

  function startEdit() {
    setForm({
      title: task.title,
      description: task.description,
    })
    setErrors({})
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    setErrors({})
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function handleSave(event) {
    event.preventDefault()
    const result = validateTask(form)

    if (!result.isValid) {
      setErrors(result.errors)
      return
    }

    onUpdate(task.id, result.values)
    setIsEditing(false)
  }

  function handleDelete() {
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`)
    if (confirmed) {
      onDelete(task.id)
    }
  }

  if (isEditing) {
    return (
      <article className="task-card task-card--editing">
        <form className="task-edit" onSubmit={handleSave} noValidate>
          <label className="field">
            <span className="field__label">Title</span>
            <input
              className={errors.title ? 'input input--error' : 'input'}
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={TITLE_MAX + 20}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title ? <span className="field__error">{errors.title}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Description</span>
            <textarea
              className={errors.description ? 'input input--error' : 'input'}
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              maxLength={DESCRIPTION_MAX + 40}
            />
            {errors.description ? (
              <span className="field__error">{errors.description}</span>
            ) : null}
          </label>

          <div className="task-actions">
            <button className="button button--primary" type="submit">
              Save changes
            </button>
            <button className="button button--ghost" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className={task.completed ? 'task-card task-card--done' : 'task-card'}>
      <label className="task-check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={task.completed ? `Mark ${task.title} as active` : `Mark ${task.title} as completed`}
        />
      </label>

      <div className="task-body">
        <div className="task-body__top">
          <h3>{task.title}</h3>
          <span className={task.completed ? 'status-pill status-pill--done' : 'status-pill'}>
            {task.completed ? 'Completed' : 'Active'}
          </span>
        </div>
        {task.description ? <p className="task-description">{task.description}</p> : null}
      </div>

      <div className="task-actions">
        <button className="button button--ghost" type="button" onClick={startEdit}>
          Edit
        </button>
        <button className="button button--danger" type="button" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}
