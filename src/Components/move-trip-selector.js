import { useState, useEffect } from "react";
import Tasks from "./tasks";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3004/api";

function MoveTripSelector() {
  const [type, setType] = useState("move"); // "move" or "trip"
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState(null);

  const endpoint = type === "move" ? "moves" : "trips";
  const dateField = type === "move" ? "target_date" : "trip_date";

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError("");
      setSelectedId(null);
      setEditingId(null);
      setNewName("");
      setNewDate("");

      try {
        const res = await fetch(`${API_BASE}/${endpoint}`);

        if (!res.ok) {
          throw new Error(`Failed to load ${endpoint}.`);
        }

        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
        setError(`Could not load ${endpoint}. Please try again.`);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [type, endpoint]);

  const createItem = async (e) => {
    e.preventDefault();

    if (!newName || !newDate) {
      alert("Please enter a name and date.");
      return;
    }

    const isEditing = editingId !== null;
    const action = isEditing ? "update" : "create";

    try {
      const res = await fetch(
        `${API_BASE}/${endpoint}${isEditing ? `/${editingId}` : ""}`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName,
            [dateField]: newDate,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to ${action} ${type}.`);
      }

      const savedItem = await res.json();
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
    setNewDate(item[dateField]?.slice(0, 10) || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewDate("");
  };

  const deleteItem = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/${endpoint}/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete ${type}.`);
      }

      setItems(items.filter((currentItem) => currentItem.id !== item.id));
      if (selectedId === item.id) {
        setSelectedId(null);
      }
      if (editingId === item.id) {
        cancelEdit();
      }
    } catch (err) {
      console.error(err);
      setError(`Could not delete ${type}. Please try again.`);
    }
  };

  return (
    <div className="move-trip-panel">
  <h1 className="panel-title">Packing Helper</h1>

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

  {/* CREATE NEW MOVE/TRIP */}
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
      <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
    )}
  </form>

  <hr className="panel-divider" />

  {/* LIST TO SELECT FROM */}
  {loading ? (
    <p className="panel-state">Loading {endpoint}...</p>
  ) : items.length === 0 ? (
    <p className="panel-state">No {endpoint} yet. Add one above.</p>
  ) : (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id} className="item-row">
          <button className="item-select-btn" onClick={() => setSelectedId(item.id)}>
            {item.name} — {item[dateField]?.slice(0, 10)}
          </button>
          <button
            type="button"
            className="btn btn-edit"
            aria-label={`Edit ${item.name}`}
            onClick={() => editItem(item)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-delete"
            aria-label={`Delete ${item.name}`}
            onClick={() => deleteItem(item)}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )}

  <hr className="panel-divider" />

  {/* TASKS FOR SELECTED MOVE/TRIP */}
  {selectedId ? (
    type === "move" ? (
      <Tasks moveId={selectedId} />
    ) : (
      <Tasks tripId={selectedId} />
    )
  ) : (
    <p className="panel-hint">Select a {type} above to see its tasks.</p>
  )}
</div>
  );
}

export default MoveTripSelector;
