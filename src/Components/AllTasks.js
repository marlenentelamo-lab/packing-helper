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

    const addTask = async (e) => {
        e.preventDefault();

        if (!taskName || !dueDate || !parentChoice) {
            alert("Please enter a task name, due date, and choose a move or trip.");
            return;
        }

        const [parentType, parentId] = parentChoice.split(":");

        try {
            const res = await fetch(`${API_BASE}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task_name: taskName,
                    due_date: dueDate,
                    completion_status: false,
                    move_id: parentType === "move" ? parentId : null,
                    trip_id: parentType === "trip" ? parentId : null,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to add task.");
            }

            setTaskName("");
            setDueDate("");
            setParentChoice("");
            await loadAll(); // Refresh the list of tasks after adding a new one
        } catch (err) {
            console.error(err);
            setError("Could not add task. Please try again.");
        }
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
        <div>
            <h2>All Tasks</h2>
            {error && <p>{error}</p>}
            <form onSubmit={addTask}>
                <div>
                    <label>Task</label>
                    <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                    />
                </div>
                <div>
                    <label>Due Date</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                <div>
                    <label>Belongs To</label>
                    <select
                        value={parentChoice}
                        onChange={(e) => setParentChoice(e.target.value)}
                    >
                        <option value="">Select a move or trip</option>
                        {moves.map((move) => (
                            <option key={`move.${move.id}`} value={`move.${move.id}`}>
                            Move: {move.name}
                            </option>
                        ))}
                        {trips.map((trip) => (
                            <option key={`trip.${trip.id}`} value={`trip.${trip.id}`}>
                            Trip: {trip.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit">Add Task</button>
            </form>

            <hr />
            {loading ? (
                <p>Loading...</p>
            ) : tasks.length === 0 ? (
                <p>No tasks yet.</p>
            ) : (
                <ul>
                    {tasks.map((task) => (
                        <li key={task.id}>
                            <input
                                type="checkbox"
                                checked={task.completion_status}
                                onChange={() => toggleTaskCompletion(task)}
                            />
                            <span style={{ textDecoration: task.completion_status ? "line-through" : "none" }}>
                                {task.task_name}
                            </span>

                            <p>
                                Belongs to:
                                {task.move_id ? ` Move: ${moves.find(m => m.id === task.move_id)?.name}` : ""}
                                {task.trip_id ? ` Trip: ${trips.find(t => t.id === task.trip_id)?.name}` : ""}
                            </p>
                            <p>Due Date: {task.due_date ? task.due_date.slice(0, 10) : "-"}</p>
                            <button onClick={() => deleteTask(task.id)}>Delete</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AllTasks;