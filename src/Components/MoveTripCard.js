import {
  countdownText,
  daysUntil,
  formatLong,
  formatShort,
  isOverdue,
  previewTasks,
} from "./MovesTripsHelpers";

function MoveTripCard({
  item,
  type,
  date,
  tasks,
  managing,
  onToggleTask,
  onManage,
  onEdit,
  onDelete,
}) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completion_status).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const preview = previewTasks(tasks);
  const hidden = total - preview.length;

  return (
    <section className={managing ? "mt-card mt-card-selected" : "mt-card"}>
      <div className="mt-card-head">
        <span className={`mt-badge mt-badge-${type}`}>
          {type === "move" ? "Move" : "Trip"}
        </span>
        <span className="mt-countdown">{countdownText(daysUntil(date), type)}</span>
      </div>

      <h2 className="mt-name">{item.name}</h2>
      <p className="mt-date">{formatLong(date)}</p>

      <div className="mt-progress">
        <div className="mt-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-progress-text">
        {done} of {total} {total === 1 ? "task" : "tasks"} done
      </p>

      {total === 0 ? (
        <p className="mt-empty-tasks">No tasks yet for this {type}.</p>
      ) : (
        <ul className="mt-tasks">
          {preview.map((task) => {
            const checkId = `mt-task-${task.id}`;
            const overdue = isOverdue(task);
            return (
              <li key={task.id} className="mt-task">
                <input
                  id={checkId}
                  type="checkbox"
                  className="mt-task-check"
                  checked={!!task.completion_status}
                  onChange={() => onToggleTask(item, task)}
                />
                <label htmlFor={checkId} className="mt-task-label">
                  <span
                    className={
                      task.completion_status ? "mt-task-name mt-task-name-done" : "mt-task-name"
                    }
                  >
                    {task.task_name}
                  </span>
                  <span className={overdue ? "mt-task-meta mt-task-meta-overdue" : "mt-task-meta"}>
                    {task.completion_status
                      ? "Done"
                      : task.due_date
                      ? `${overdue ? "Overdue, " : "Due "}${formatShort(task.due_date)}`
                      : "No due date"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {hidden > 0 && !managing && (
        <button type="button" className="mt-more" onClick={() => onManage(item)}>
          See {hidden} more {hidden === 1 ? "task" : "tasks"}
        </button>
      )}

      <div className="mt-actions">
        <button type="button" className="btn btn-primary" onClick={() => onManage(item)}>
          {managing ? "Hide tasks" : "Manage tasks"}
        </button>
        <button
          type="button"
          className="btn btn-edit"
          aria-label={`Edit ${item.name}`}
          onClick={() => onEdit(item)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-delete"
          aria-label={`Delete ${item.name}`}
          onClick={() => onDelete(item)}
        >
          Delete
        </button>
      </div>
    </section>
  );
}

export default MoveTripCard;
