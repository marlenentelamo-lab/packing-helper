import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3004/api";

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

  // CREATE
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
    <div>
      <h1>Tasks</h1>

      {error && <p>{error}</p>}

      {/* TASK LIST */}
      <form onSubmit={editingId ? saveTask : addTask}>
        <div>
          <label>Task:</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task"
          />
        </div>

        <div>
          <label>Due Date:</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <button type="submit">{editingId ? "Save Task" : "Add Task"}</button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      <hr />

      {/* TASK LIST */}
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id}>
            <input
              type="checkbox"
              checked={task.completion_status}
              onChange={() => toggleCompleted(task)}
            />

            <h3
              style={{
                textDecoration: task.completion_status
                  ? "line-through"
                  : "none",
              }}
            >
              {task.task_name}
            </h3>

            <p>Due: {task.due_date ? task.due_date.slice(0, 10) : "—"}</p>

            <p>
              Status: {task.completion_status ? "Completed" : "Not completed"}
            </p>

            <button onClick={() => editTask(task)}>Edit</button>
            <button onClick={() => deleteTask(task.id)}>Delete</button>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Task;
