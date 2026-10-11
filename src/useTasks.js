import { useEffect, useMemo, useState } from 'react'
import { loadTasks, saveTasks } from './storage'

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useTasks() {
  const [tasks, setTasks] = useState(() => loadTasks())
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    const saved = saveTasks(tasks)
    setStorageError(saved ? '' : 'Tasks could not be saved to this browser.')
  }, [tasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    return {
      total,
      completed,
      remaining: total - completed,
    }
  }, [tasks])

  function addTask({ title, description }) {
    const now = Date.now()
    const nextTask = {
      id: createId(),
      title,
      description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    setTasks((current) => [nextTask, ...current])
  }

  function updateTask(id, { title, description }) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              title,
              description,
              updatedAt: Date.now(),
            }
          : task,
      ),
    )
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              updatedAt: Date.now(),
            }
          : task,
      ),
    )
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  return {
    tasks,
    stats,
    storageError,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  }
}
