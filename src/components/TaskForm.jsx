import { useState } from 'react'
import { DESCRIPTION_MAX, TITLE_MAX, validateTask } from '../validation'

const emptyForm = {
  title: '',
  description: '',
}

export default function TaskForm({ onAdd }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateTask(form)

    if (!result.isValid) {
      setErrors(result.errors)
      return
    }

    onAdd(result.values)
    setForm(emptyForm)
    setErrors({})
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Add a task</h2>
          <p>Capture the next action with an optional note.</p>
        </div>
      </div>

      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">
            Title <span className="field__required">required</span>
          </span>
          <input
            className={errors.title ? 'input input--error' : 'input'}
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Write the next action"
            maxLength={TITLE_MAX + 20}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title ? (
            <span id="title-error" className="field__error">
              {errors.title}
            </span>
          ) : (
            <span className="field__meta">{form.title.trim().length}/{TITLE_MAX}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            className={errors.description ? 'input input--error' : 'input'}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Add context if it will help later"
            rows="3"
            maxLength={DESCRIPTION_MAX + 40}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description ? (
            <span id="description-error" className="field__error">
              {errors.description}
            </span>
          ) : (
            <span className="field__meta">
              {form.description.trim().length}/{DESCRIPTION_MAX}
            </span>
          )}
        </label>

        <div className="form-actions">
          <button className="button button--primary" type="submit">
            Add task
          </button>
        </div>
      </form>
    </section>
  )
}
