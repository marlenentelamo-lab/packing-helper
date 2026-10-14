import { useState, useEffect } from "react";
import { api } from "../api";
import MoveTripCard from "./MoveTripCard";
import { daysUntil } from "./MovesTripsHelpers";

// The address of your All Tasks page. Change this if your route is different.
const ALL_TASKS_PATH = "/alltasks";

function MoveTripSelector() {
  const [type, setType] = useState("move"); // "move" or "trip"
  const [items, setItems] = useState([]);
  const [tasksByItem, setTasksByItem] = useState({}); // { [itemId]: [tasks] } for the card previews
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState(null);

  const endpoint = type === "move" ? "moves" : "trips";
  const dateField = type === "move" ? "target_date" : "trip_date";
  const getDate = (item) => item[dateField]?.slice(0, 10) || "";

  useEffect(() => {
    let cancelled = false; // ignore a slow response if the user switched type meanwhile

    async function fetchItems() {
      setLoading(true);
      setError("");
      setEditingId(null);
      setNewName("");
      setNewDate("");

      try {
        const data = await api.get(`/${endpoint}`);

        // One tasks request per move or trip, all at the same time.
        const entries = await Promise.all(
          data.map(async (item) => {
            try {
              return [item.id, await api.get(`/tasks?${type}_id=${item.id}`)];
            } catch (err) {
              console.error(err);
              return [item.id, []];
            }
          })
        );

        if (cancelled) return;
        setItems(data);
        setTasksByItem(Object.fromEntries(entries));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(`Could not load ${endpoint}. Please try again.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [type, endpoint]);

  // Upcoming first (soonest at the top), then past ones (most recent first).
  const sortedItems = [
    ...items
      .filter((i) => daysUntil(getDate(i)) >= 0)
      .sort((a, b) => getDate(a).localeCompare(getDate(b))),
    ...items
      .filter((i) => daysUntil(getDate(i)) < 0)
      .sort((a, b) => getDate(b).localeCompare(getDate(a))),
  ];

  const createItem = async (e) => {
    e.preventDefault();

    if (!newName || !newDate) {
      alert("Please enter a name and date.");
      return;
    }

    const isEditing = editingId !== null;
    const action = isEditing ? "update" : "create";

    try {
      const body = { name: newName, [dateField]: newDate };
      const savedItem = isEditing
        ? await api.put(`/${endpoint}/${editingId}`, body)
        : await api.post(`/${endpoint}`, body);
      if (isEditing) {
        setItems(items.map((item) => (item.id === editingId ? savedItem : item)));
        setEditingId(null);
      } else {
        setItems([...items, savedItem]);
      }
      setNewName("");
      setNewDate("");
    } catch (err) {
      console.error(err);
      setError(`Could not ${action} ${type}. Please try again.`);
    }
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setNewName(item.name);
    setNewDate(getDate(item));
    window.scrollTo({ top: 0, behavior: "smooth" }); // the form is at the top of the page
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewDate("");
  };

  const deleteItem = async (item) => {
    try {
      await api.del(`/${endpoint}/${item.id}`);
      setItems(items.filter((currentItem) => currentItem.id !== item.id));
      if (editingId === item.id) {
        cancelEdit();
      }
    } catch (err) {
      console.error(err);
      setError(`Could not delete ${type}. Please try again.`);
    }
  };

  // Tick or untick a task right on the card.
  const toggleTask = async (item, task) => {
    const next = !task.completion_status;
    const setStatus = (status) =>
      setTasksByItem((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] || []).map((t) =>
          t.id === task.id ? { ...t, completion_status: status } : t
        ),
      }));

    setStatus(next); // show the change right away
    try {
      await api.put(`/tasks/${task.id}`, {
        task_name: task.task_name,
        due_date: task.due_date ? String(task.due_date).slice(0, 10) : null,
        completion_status: next,
        // sent so the update can never clear the task's move or trip
        move_id: task.move_id ?? null,
        trip_id: task.trip_id ?? null,
      });
    } catch (err) {
      console.error(err);
      setStatus(!next); // undo if it failed
      setError("Could not update the task. Please try again.");
    }
  };

  return (
    <div className="move-trip-panel">
      <h1 className="panel-title">Moves & Trips</h1>

      {/* TYPE SWITCH */}
      <div className="type-switch">
        <button
          className={`type-switch-btn${type === "move" ? " is-active" : ""}`}
          onClick={() => setType("move")}
          disabled={type === "move"}
        >
          Moves
        </button>
        <button
          className={`type-switch-btn${type === "trip" ? " is-active" : ""}`}
          onClick={() => setType("trip")}
          disabled={type === "trip"}
        >
          Trips
        </button>
      </div>

      {error && <p className="panel-error">{error}</p>}

      {/* CREATE / EDIT A MOVE OR TRIP */}
      <form className="item-form" onSubmit={createItem}>
        <div className="form-field">
          <label htmlFor="move-trip-name">Name:</label>
          <input
            id="move-trip-name"
            className="field-input"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={type === "move" ? "e.g. Move to Cape Town" : "e.g. Summer Holiday"}
          />
        </div>

        <div className="form-field">
          <label htmlFor="move-trip-date">
            {type === "move" ? "Target Date:" : "Trip Date:"}
          </label>
          <input
            id="move-trip-date"
            className="field-input"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {editingId !== null
            ? `Save ${type === "move" ? "Move" : "Trip"}`
            : `Add ${type === "move" ? "Move" : "Trip"}`}
        </button>
        {editingId !== null && (
          <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <hr className="panel-divider" />

      {/* CARDS */}
      {loading ? (
        <p className="panel-state">Loading {endpoint}...</p>
      ) : items.length === 0 ? (
        <p className="panel-state">No {endpoint} yet. Add one above.</p>
      ) : (
        <div className="mt-grid">
          {sortedItems.map((item) => (
            <MoveTripCard
              key={item.id}
              item={item}
              type={type}
              date={getDate(item)}
              tasks={tasksByItem[item.id] || []}
              tasksLink={`${ALL_TASKS_PATH}?${type}=${item.id}`}
              onToggleTask={toggleTask}
              onEdit={editItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MoveTripSelector;
