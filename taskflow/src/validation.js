export const TITLE_MAX = 80
export const DESCRIPTION_MAX = 280

export function validateTask({ title, description }) {
  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const errors = {}

  if (!trimmedTitle) {
    errors.title = 'Add a task title to continue.'
  } else if (trimmedTitle.length > TITLE_MAX) {
    errors.title = `Keep titles to ${TITLE_MAX} characters or fewer.`
  }

  if (trimmedDescription.length > DESCRIPTION_MAX) {
    errors.description = `Keep descriptions to ${DESCRIPTION_MAX} characters or fewer.`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    values: {
      title: trimmedTitle,
      description: trimmedDescription,
    },
    errors,
  }
}
