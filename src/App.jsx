import { useMemo, useState } from 'react'
import StatsBar from './components/StatsBar'
import TaskFilters from './components/TaskFilters'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import { useTasks } from './useTasks'

export default function App() {
  const { tasks, stats, storageError, addTask, updateTask, toggleTask, deleteTask } =
    useTasks()
  const [filter, setFilter] = useState('all')

  const visibleTasks = useMemo(() => {
    if (filter === 'active') {
      return tasks.filter((task) => !task.completed)
    }
    if (filter === 'completed') {
      return tasks.filter((task) => task.completed)
    }
    return tasks
  }, [tasks, filter])

  const filterCounts = {
    all: stats.total,
    active: stats.remaining,
    completed: stats.completed,
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <p className="brand__kicker">Personal workspace</p>
            <h1>TaskFlow</h1>
          </div>
        </div>
        <p className="hero__copy">
          A focused dashboard for capturing work, finishing it, and keeping the
          list in this browser.
        </p>
      </header>

      {storageError ? (
        <p className="banner" role="status">
          {storageError}
        </p>
      ) : null}

      <StatsBar stats={stats} />

      <div className="layout">
        <TaskForm onAdd={addTask} />

        <section className="panel panel--list">
          <div className="panel__header panel__header--row">
            <div>
              <h2>Your tasks</h2>
              <p>
                {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'} in this
                view
              </p>
            </div>
            <TaskFilters filter={filter} counts={filterCounts} onChange={setFilter} />
          </div>

          <TaskList
            tasks={visibleTasks}
            filter={filter}
            onToggle={toggleTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        </section>
      </div>
    </div>
  )
}
