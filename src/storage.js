export const STORAGE_KEY = 'taskflow.tasks.v1'

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (task) =>
          task &&
          typeof task === 'object' &&
          typeof task.id === 'string' &&
          typeof task.title === 'string' &&
          typeof task.completed === 'boolean',
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: typeof task.description === 'string' ? task.description : '',
        completed: task.completed,
        createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
        updatedAt: typeof task.updatedAt === 'number' ? task.updatedAt : Date.now(),
      }))
  } catch {
    return []
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    return true
  } catch {
    return false
  }
}
