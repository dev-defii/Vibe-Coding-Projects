import TaskItem from './TaskItem'

const EMPTY_COPY = {
  all: {
    title: 'No tasks yet',
    body: 'Add your first task to start tracking work in TaskFlow.',
  },
  active: {
    title: 'No active tasks',
    body: 'Everything is complete, or you have not added any open work yet.',
  },
  completed: {
    title: 'No completed tasks',
    body: 'Mark a task as done to see it here.',
  },
}

export default function TaskList({ tasks, filter, onToggle, onUpdate, onDelete }) {
  if (tasks.length === 0) {
    const copy = EMPTY_COPY[filter]
    return (
      <div className="empty-state">
        <p className="empty-state__kicker">Nothing to show</p>
        <h3>{copy.title}</h3>
        <p>{copy.body}</p>
      </div>
    )
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
