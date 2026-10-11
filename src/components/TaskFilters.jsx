const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
]

export default function TaskFilters({ filter, counts, onChange }) {
  return (
    <div className="filters" role="tablist" aria-label="Filter tasks">
      {FILTERS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={filter === item.id}
          className={filter === item.id ? 'chip chip--active' : 'chip'}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          <span className="chip__count">{counts[item.id]}</span>
        </button>
      ))}
    </div>
  )
}
