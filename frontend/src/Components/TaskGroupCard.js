import { useState } from 'react';
import {
  countdownText,
  daysUntil,
  formatLong,
  formatShort,
  GROUP_LIMIT,
  isOverdue,
  previewTasks,
} from './MovesTripsHelpers';

function TaskGroupCard({
  group,
  highlighted,
  onToggleTask,
  onToggleCompletion,
  onEditTask,
  onDeleteTask,
  onAddTask,
  completionUpdating,
}) {
  const [expanded, setExpanded] = useState(false);

  const { tasks, type } = group;
  const total = tasks.length;
  const done = tasks.filter((t) => t.completion_status).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const shown = previewTasks(tasks, expanded ? total : GROUP_LIMIT);
  const hidden = total - GROUP_LIMIT;

  return (
    <section
      id={`group-${group.key}`}
      className={highlighted ? "mt-card mt-card-selected" : "mt-card"}
    >
      <div className="mt-card-head">
        {type === "none" ? (
          <span className="tg-no-parent">No move or trip</span>
        ) : (
          <span className={`mt-badge mt-badge-${type}`}>
            {type === "move" ? "Move" : "Trip"}
          </span>
        )}
        {group.date && (
          <span className="mt-countdown">{countdownText(daysUntil(group.date), type)}</span>
        )}
      </div>

      <h2 className={group.completion_status ? "mt-name mt-name-complete" : "mt-name"}>
        {group.name}
      </h2>
      {group.date && <p className="mt-date">{formatLong(group.date)}</p>}

      {type !== "none" && (
        <div className="mt-completion-label">
          <input
            type="checkbox"
            className="mt-completion-check"
            checked={!!group.completion_status}
            disabled={completionUpdating}
            onChange={(event) => onToggleCompletion(group, event.target.checked)}
            aria-label={`Mark ${group.name} as ${
              group.completion_status ? "not completed" : "completed"
            }`}
          />
        </div>
      )}

      <div className="mt-progress">
        <div className="mt-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-progress-text">
        {done} of {total} {total === 1 ? "task" : "tasks"} done
      </p>

      {total === 0 ? (
        <p className="mt-empty-tasks">No tasks yet for this {type === "none" ? "group" : type}.</p>
      ) : (
        <ul className="mt-tasks">
          {shown.map((task) => {
            const checkId = `tg-check-${task.id}`;
            const overdue = isOverdue(task);
            return (
              <li key={task.id} className="mt-task tg-task">
                <input
                  id={checkId}
                  type="checkbox"
                  className="mt-task-check"
                  checked={!!task.completion_status}
                  onChange={() => onToggleTask(task)}
                />
                <label htmlFor={checkId} className="mt-task-label tg-task-label">
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
                <div className="tg-task-btns">
                  <button
                    type="button"
                    className="btn btn-edit"
                    aria-label={`Edit ${task.task_name}`}
                    onClick={() => onEditTask(task)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-delete"
                    aria-label={`Delete ${task.task_name}`}
                    onClick={() => onDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {total > GROUP_LIMIT && (
        <button
          type="button"
          className="mt-more"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show fewer tasks" : `Show ${hidden} more ${hidden === 1 ? "task" : "tasks"}`}
        </button>
      )}

      {type !== "none" && (
        <div className="mt-actions">
          <button type="button" className="btn btn-primary" onClick={() => onAddTask(group)}>
            + Add task
          </button>
        </div>
      )}
    </section>
  );
}

export default TaskGroupCard;
