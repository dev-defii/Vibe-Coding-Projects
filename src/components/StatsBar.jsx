function StatCard({ label, value, hint, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__hint">{hint}</p>
    </article>
  )
}

export default function StatsBar({ stats }) {
  return (
    <section className="stats-grid" aria-label="Task summary">
      <StatCard
        label="Total tasks"
        value={stats.total}
        hint="Everything currently saved"
        tone="total"
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        hint="Marked as done"
        tone="completed"
      />
      <StatCard
        label="Remaining"
        value={stats.remaining}
        hint="Still waiting on you"
        tone="remaining"
      />
    </section>
  )
}
