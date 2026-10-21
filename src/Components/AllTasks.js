import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import TaskGroupCard from "./TaskGroupCard";
import BackToTop from "./BackToTop";
import { daysUntil } from "./MovesTripsHelpers";

const API_BASE = "/api";

const sameId = (a, b) => String(a) === String(b);

function buildGroups(moves, trips, tasks) {
    const groups = [
        ...moves.map((m) => ({
            key: `move-${m.id}`,
            type: "move",
            id: m.id,
            name: m.name,
            date: m.target_date?.slice(0, 10) || "",
            completion_status: m.completion_status,
            tasks: tasks.filter((t) => sameId(t.move_id, m.id)),
        })),
        ...trips.map((t) => ({
            key: `trip-${t.id}`,
            type: "trip",
            id: t.id,
            name: t.name,
            date: t.trip_date?.slice(0, 10) || "",
            completion_status: t.completion_status,
            tasks: tasks.filter((task) => sameId(task.trip_id, t.id)),
        })),
    ];

    const upcoming = groups
        .filter((g) => g.date && daysUntil(g.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date));
    const past = groups
        .filter((g) => g.date && daysUntil(g.date) < 0)
        .sort((a, b) => b.date.localeCompare(a.date));
    const undated = groups.filter((g) => !g.date);

    const result = [...upcoming, ...past, ...undated];

    const orphans = tasks.filter((t) => !t.move_id && !t.trip_id);
    if (orphans.length > 0) {
        result.push({ key: "none", type: "none", id: null, name: "Other tasks", date: "", tasks: orphans });
    }
    return result;
}

function AllTasks() {
    const [tasks, setTasks] = useState([]);
    const [moves, setMoves] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [completionUpdating, setCompletionUpdating] = useState(false);

    const [taskName, setTaskName] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [parentChoice, setParentChoice] = useState("");
    const [editingTask, setEditingTask] = useState(null);

    const [searchParams] = useSearchParams();
    const focusKey = searchParams.get("move")
        ? `move-${searchParams.get("move")}`
        : searchParams.get("trip")
        ? `trip-${searchParams.get("trip")}`
        : null;

    const loadAll = async (isFirstLoad = false) => {
        if (isFirstLoad) setLoading(true);
        setError("");

        try {
            const [tasksRes, movesRes, tripsRes] = await Promise.all([
                fetch(`${API_BASE}/tasks`, { credentials: "include" }),
                fetch(`${API_BASE}/moves`, { credentials: "include" }),
                fetch(`${API_BASE}/trips`, { credentials: "include" }),
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
        loadAll(true);
    }, []);

    useEffect(() => {
        if (loading || !focusKey) return;
        document
            .getElementById(`group-${focusKey}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [loading, focusKey]);

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
                credentials: "include",
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
        window.scrollTo({ top: 0, behavior: "smooth" }); // the form is at the top of the page
    };

    const toggleTaskCompletion = async (task) => {
        try {
            const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task_name: task.task_name,
                    due_date: task.due_date ? task.due_date.slice(0, 10) : null,
                    completion_status: !task.completion_status,
                    // sent so the update can never clear the task's move or trip
                    move_id: task.move_id ?? null,
                    trip_id: task.trip_id ?? null,
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

    const toggleGroupCompletion = async (group, completion_status) => {
        if (completionUpdating) return;
        setCompletionUpdating(true);
        setError("");

        const isMove = group.type === "move";
        try {
            const res = await fetch(`${API_BASE}/${isMove ? "moves" : "trips"}/${group.id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    completion_status,
                }),
            });
            if (!res.ok) throw new Error("Failed to update completion status.");

            const updatedGroup = await res.json();
            if (isMove) {
                setMoves((current) => current.map((move) =>
                    move.id === group.id ? updatedGroup : move
                ));
            } else {
                setTrips((current) => current.map((trip) =>
                    trip.id === group.id ? updatedGroup : trip
                ));
            }
        } catch (err) {
            console.error(err);
            setError(`Could not update ${group.type} completion. Please try again.`);
        } finally {
            setCompletionUpdating(false);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: "DELETE",
                credentials: "include",
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

    const addTaskTo = (group) => {
        resetForm();
        setParentChoice(`${group.type}:${group.id}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("task-name")?.focus();
    };

    const groups = buildGroups(moves, trips, tasks);

    return (
       <div className="task-list all-tasks-page">
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
    ) : groups.length === 0 ? (
        <p className="task-list-state">No moves or trips yet. Add one on the Moves & Trips page.</p>
    ) : (
        <div className="mt-grid">
            {groups.map((group) => (
                <TaskGroupCard
                    key={group.key}
                    group={group}
                    highlighted={group.key === focusKey}
                    onToggleTask={toggleTaskCompletion}
                    onToggleCompletion={toggleGroupCompletion}
                    completionUpdating={completionUpdating}
                    onEditTask={editTask}
                    onDeleteTask={deleteTask}
                    onAddTask={addTaskTo}
                />
            ))}
        </div>
    )}
    <BackToTop />
</div>
    );
}

export default AllTasks;
