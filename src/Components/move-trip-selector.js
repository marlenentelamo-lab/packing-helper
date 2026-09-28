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

  const endpoint = type === "move" ? "moves" : "trips";
  const dateField = type === "move" ? "target_date" : "trip_date";

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError("");
      setSelectedId(null);

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

    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          [dateField]: newDate,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create ${type}.`);
      }

      const newItem = await res.json();
      setItems([...items, newItem]);
      setNewName("");
      setNewDate("");
    } catch (err) {
      console.error(err);
      setError(`Could not create ${type}. Please try again.`);
    }
  };

  return (
    <div>
      <h1>Packing Helper</h1>

      {/* TYPE SWITCH */}
      <div>
        <button onClick={() => setType("move")} disabled={type === "move"}>
          Moves
        </button>
        <button onClick={() => setType("trip")} disabled={type === "trip"}>
          Trips
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* CREATE NEW MOVE/TRIP */}
      <form onSubmit={createItem}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={type === "move" ? "e.g. Move to Cape Town" : "e.g. Summer Holiday"}
          />
        </div>

        <div>
          <label>{type === "move" ? "Target Date:" : "Trip Date:"}</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>

        <button type="submit">Add {type === "move" ? "Move" : "Trip"}</button>
      </form>

      <hr />

      {/* LIST TO SELECT FROM */}
      {loading ? (
        <p>Loading {endpoint}...</p>
      ) : items.length === 0 ? (
        <p>No {endpoint} yet. Add one above.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button onClick={() => setSelectedId(item.id)}>
                {item.name} — {item[dateField]?.slice(0, 10)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr />

      {/* TASKS FOR SELECTED MOVE/TRIP */}
      {selectedId ? (
        type === "move" ? (
          <Tasks moveId={selectedId} />
        ) : (
          <Tasks tripId={selectedId} />
        )
      ) : (
        <p>Select a {type} above to see its tasks.</p>
      )}
    </div>
  );
}

export default MoveTripSelector;
