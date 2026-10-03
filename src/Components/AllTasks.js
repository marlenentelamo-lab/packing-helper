import {  useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3004/api";

function AllTasks() {
    const [tasks, setTasks] = useState([]);
    const [moves, setMoves] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [taskName, setTaskName] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [parentChoice, setParentChoice] = useState("");
    const [editingTask, setEditingTask] = useState(null);

    const loadAll = async () => {
        setLoading(true);
        setError("");

        try {
            const [tasksRes, movesRes, tripsRes] = await Promise.all([
                fetch(`${API_BASE}/tasks`),
                fetch(`${API_BASE}/moves`),
                fetch(`${API_BASE}/trips`),
            ]);

            if (!tasksRes.ok || !movesRes.ok || !tripsRes.ok) {
                throw new Error("Failed to load data.");
            }

            setTasks(await tasksRes.json());
            setMoves(await movesRes.json());
            setTrips(await tripsRes.json());
        } catch (err) {
            console.error(err);
            setError("Could not load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const resetForm = () => {
        setTaskName("");
        setDueDate("");
        setParentChoice("");
        setEditingTask(null);
    };

    const saveTask = async (e) => {
        e.preventDefault();

        if (!taskName || !dueDate || !parentChoice) {
            alert("Please enter a task name, due date, and choose a move or trip.");
            return;
        }

        const [parentType, parentId] = parentChoice.split(":");
        const isEditing = editingTask !== null;

        try {
            const res = await fetch(
                `${API_BASE}/tasks${isEditing ? `/${editingTask.id}` : ""}`,
                {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task_name: taskName,
                    due_date: dueDate,
                    completion_status: editingTask?.completion_status ?? false,
                    move_id: parentType === "move" ? parentId : null,
                    trip_id: parentType === "trip" ? parentId : null,
                }),
                },
            );

            if (!res.ok) {
                throw new Error(`Failed to ${isEditing ? "update" : "add"} task.`);
            }

            resetForm();
            await loadAll(); // Refresh the list of tasks after adding a new one
        } catch (err) {
            console.error(err);
            setError(`Could not ${isEditing ? "save changes" : "add task"}. Please try again.`);
        }
    };

    const editTask = (task) => {
        setEditingTask(task);
        setTaskName(task.task_name);
        setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
        setParentChoice(
            task.move_id
                ? `move:${task.move_id}`
                : task.trip_id
                ? `trip:${task.trip_id}`
                : "",
        );
    };

    const toggleTaskCompletion = async (task) => {
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

            await loadAll(); // Refresh the list of tasks after updating completion status
        } catch (err) {
            console.error(err);
            setError("Could not update task. Please try again.");
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete task.");
            }

            await loadAll(); // Refresh the list of tasks after deleting
        } catch (err) {
            console.error(err);
            setError("Could not delete task. Please try again.");
        }
    };

    return (
       <div className="task-list">
    <h2 className="task-list-title">All Tasks</h2>
    {error && <p className="task-list-error">{error}</p>}
    <form className="task-form" onSubmit={saveTask}>
        <div className="form-field">
            <label htmlFor="task-name">Task</label>
            <input
                id="task-name"
                className="field-input"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
            />
        </div>
        <div className="form-field">
            <label htmlFor="task-due-date">Due Date</label>
            <input
                id="task-due-date"
                className="field-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />
        </div>
        <div className="form-field">
            <label htmlFor="task-parent">Belongs To</label>
            <select
                id="task-parent"
                className="field-select"
                value={parentChoice}
                onChange={(e) => setParentChoice(e.target.value)}
            >
                <option value="">Select a move or trip</option>
                {moves.map((move) => (
                    <option key={`move.${move.id}`} value={`move:${move.id}`}>
                    Move: {move.name}
                    </option>
                ))}
                {trips.map((trip) => (
                    <option key={`trip.${trip.id}`} value={`trip:${trip.id}`}>
                    Trip: {trip.name}
                    </option>
                ))}
            </select>
        </div>

        <button type="submit" className="btn btn-primary">{editingTask ? "Save Task" : "Add Task"}</button>
        {editingTask && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
        )}
    </form>

    <hr className="task-divider" />
    {loading ? (
        <p className="task-list-state">Loading...</p>
    ) : tasks.length === 0 ? (
        <p className="task-list-state">No tasks yet.</p>
    ) : (
        <ul className="task-items">
            {tasks.map((task) => (
                <li key={task.id} className="task-item">
                    <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={task.completion_status}
                        onChange={() => toggleTaskCompletion(task)}
                    />
                    <span className={`task-name${task.completion_status ? " is-complete" : ""}`}>
                        {task.task_name}
                    </span>

                    <p className="task-meta">
                        Belongs to:
                        {task.move_id ? ` Move: ${moves.find(m => m.id === task.move_id)?.name}` : ""}
                        {task.trip_id ? ` Trip: ${trips.find(t => t.id === task.trip_id)?.name}` : ""}
                    </p>
                    <p className="task-due">Due Date: {task.due_date ? task.due_date.slice(0, 10) : "-"}</p>
                    <button type="button" className="btn btn-edit" onClick={() => editTask(task)}>
                        Edit
                    </button>
                    <button className="btn btn-delete" onClick={() => deleteTask(task.id)}>Delete</button>
                </li>
            ))}
        </ul>
    )}
</div>
    );
}

export default AllTasks;