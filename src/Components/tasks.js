import { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3004/api";

function isOverdue(task) {
  if (!task?.due_date || task.completion_status) {
    return false;
  }

  const dueDate = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function Task({ moveId, tripId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState(null);

  const parentQuery = moveId
    ? `move_id=${moveId}`
    : tripId
    ? `trip_id=${tripId}`
    : null;

    useEffect(() => {
        if (!parentQuery) {
          setError("A moveId or tripId prop is required.");
          setLoading(false);
          return;
        }

        async function fetchTasks() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/tasks?${parentQuery}`);

        if (!res.ok) {
          throw new Error("Failed to load tasks.");
        }

        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
        setError("Could not load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    }

      fetchTasks();
    }, [parentQuery]);

    const resetForm = () => {
      setTaskName("");
      setDueDate("");
      setEditingId(null);
    };

  const addTask = async (e) => {
    e.preventDefault();

    if (!taskName || !dueDate) {
      alert("Please enter a task name and due date.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_name: taskName,
          due_date: dueDate,
          completion_status: false,
          move_id: moveId ?? null,
          trip_id: tripId ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create task.");
      }

        const newTask = await res.json();
        setTasks([...tasks, newTask]);
        resetForm();
      } catch (err) {
        console.error(err);
        setError("Could not create task. Please try again.");
      }
    };

      const deleteTask = async (id) => {
      try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete task.");
        }

        setTasks(tasks.filter((task) => task.id !== id));
      } catch (err) {
        console.error(err);
        setError("Could not delete task. Please try again.");
      }
    };

      const toggleCompleted = async (task) => {
      try {
        const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_name: task.task_name,
            due_date: task.due_date,
            completion_status: !task.completion_status,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update task.");
        }

        const updatedTask = await res.json();
        setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      } catch (err) {
        console.error(err);
        setError("Could not update task. Please try again.");
      }
    };

      const editTask = (task) => {
      setEditingId(task.id);
      setTaskName(task.task_name);
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    };

      const saveTask = async (e) => {
      e.preventDefault();

      try {
        const res = await fetch(`${API_BASE}/tasks/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_name: taskName,
            due_date: dueDate,
            completion_status:
              tasks.find((t) => t.id === editingId)?.completion_status ?? false,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update task.");
        }

        const updatedTask = await res.json();
        setTasks(tasks.map((t) => (t.id === editingId ? updatedTask : t)));
        resetForm();
      } catch (err) {
        console.error(err);
        setError("Could not save changes. Please try again.");
      }
    };

return (
  <div className="tasks-page">
    <h1 className="tasks-title">Tasks</h1>

    {error && <p className="panel-error">{error}</p>}

    <form className="task-form" onSubmit={editingId ? saveTask : addTask}>
      <div className="form-field task-form-grow">
        <label htmlFor="task-name-input">Task</label>
        <input
          id="task-name-input"
          className="field-input"
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Enter task"
        />
      </div>

      <div className="form-field task-form-date">
        <label htmlFor="task-due-date">Due date</label>
        <input
          id="task-due-date"
          className="field-input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="task-form-actions">
        <button type="submit" className="btn btn-primary">
          {editingId ? "Save Task" : "Add Task"}
        </button>

        {editingId && (
          <button type="button" className="btn btn-secondary" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>
    </form>

    {/* TASK LIST */}
    {loading ? (
      <p className="panel-state">Loading tasks...</p>
    ) : tasks.length === 0 ? (
      <p className="panel-state">No tasks yet.</p>
    ) : (
      <div className="task-list">
        {tasks.map((task) => {
          const overdue = isOverdue(task);
          return (
            <div
              key={task.id}
              className={`task-item${task.completion_status ? " task-item-done" : ""}${
                overdue ? " task-item-overdue" : ""
              }`}
            >
              <input
                type="checkbox"
                className="task-checkbox"
                aria-label={`Mark "${task.task_name}" as completed`}
                checked={task.completion_status}
                onChange={() => toggleCompleted(task)}
              />

              <div className="task-content">
                <h3
                  className={`task-name${task.completion_status ? " task-name-done" : ""}`}
                >
                  {task.task_name}
                </h3>

                <p className={`task-meta${overdue ? " task-meta-overdue" : ""}`}>
                  Due: {task.due_date ? task.due_date.slice(0, 10) : "—"}
                  {overdue && " (overdue)"}
                </p>

                <p className="task-meta">
                  Status: {task.completion_status ? "Completed" : "Not completed"}
                </p>
              </div>

              <div className="task-actions">
                <button type="button" className="btn btn-edit" onClick={() => editTask(task)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-delete"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
}

export default Task;
