import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useSelection } from './SelectionContext';

const ROUTES = {
  tasks: "/all-tasks",
  pictures: "/pictures",
  moveTripSelector: "/move-trip-selector",
};
const SOON_DAYS = 7;
const MAX_ATTENTION = 5;

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysFromToday(dateStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseLocal(dateStr) - today) / 86400000);
}

function formatDate(dateStr, withYear = true) {
  return parseLocal(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
  });
}

function dueLabel(days, dateStr) {
  if (days < 0) return `overdue · ${formatDate(dateStr, false)}`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

function countdownText(days, type) {
  if (days === null) {
    return { value: "—", label: `No ${type === "move" ? "moving" : "travel"} date set` };
  }
  if (days > 0) return { value: String(days), label: days === 1 ? "day to go" : "days to go" };
  if (days === 0) {
    return { value: "Today", label: type === "move" ? "is moving day!" : "is travel day!" };
  }
  const n = Math.abs(days);
  return { value: String(n), label: `${n === 1 ? "day" : "days"} since this ${type}` };
}

function pickDefault(items) {
  const dated = items
    .filter((i) => i.date)
    .map((i) => ({ ...i, days: daysFromToday(i.date) }));
  const upcoming = dated.filter((i) => i.days >= 0).sort((a, b) => a.days - b.days);
  if (upcoming.length) return upcoming[0];
  const past = dated.sort((a, b) => b.days - a.days);
  return past[0] || items[0] || null;
}

export default function Dashboard() {
  const { selected, setSelected } = useSelection();

  const [moves, setMoves] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
      Promise.all([api.get("/moves"), api.get("/trips")])
        .then(([m, t]) => {
          setMoves(m);
          setTrips(t);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingItems(false));
    }, []);
  
    const items = useMemo(
      () => [
        ...moves.map((m) => ({
          type: "move",
          id: String(m.id),
          name: m.name,
          date: toDateOnly(m.target_date),
        })),
        ...trips.map((t) => ({
          type: "trip",
          id: String(t.id),
          name: t.name,
          date: toDateOnly(t.trip_date),
        })),
      ],
      [moves, trips]
    );
  
    const current = selected
      ? items.find((i) => i.type === selected.type && i.id === String(selected.id))
      : null;

  useEffect(() => {
    if (loadingItems || error || current) return;
    const fallback = pickDefault(items);
    setSelected(fallback ? { type: fallback.type, id: fallback.id } : null);
  }, [loadingItems, error, current, items, setSelected]);

  const currentKey = current ? `${current.type}:${current.id}` : null;
    useEffect(() => {
      if (!current) {
        setTasks([]);
        setFolders([]);
        return;
      }
      let cancelled = false; // ignore late responses if the user switches quickly
      const idKey = current.type === "move" ? "move_id" : "trip_id";
      const query = `${idKey}=${encodeURIComponent(current.id)}`;
  
      setLoadingDetails(true);
      setError("");
      Promise.all([api.get(`/tasks?${query}`), api.get(`/picture-folders?${query}`)])
        .then(([t, f]) => {
          if (cancelled) return;
          setTasks(t);
          setFolders(f);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoadingDetails(false);
        });
  
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentKey]);
  
    const handleSelect = (e) => {
      if (!e.target.value) return;
      const [type, id] = e.target.value.split(":");
      setSelected({ type, id });
    };
  
    // Tick a task off straight from the dashboard
    const completeTask = async (task) => {
      setError("");
      try {
        await api.put(`/tasks/${task.id}`, {
          task_name: task.task_name,
          due_date: toDateOnly(task.due_date),
          completion_status: !task.completion_status,
        });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, completion_status: !t.completion_status } : t
          )
        );
      } catch (err) {
        setError(err.message);
      }
    };

    const total = tasks.length;
      const done = tasks.filter((t) => t.completion_status).length;
      const percent = total ? Math.round((done / total) * 100) : 0;
    
      const attention = useMemo(
        () =>
          tasks
            .filter((t) => !t.completion_status && toDateOnly(t.due_date))
            .map((t) => {
              const date = toDateOnly(t.due_date);
              return { task: t, date, days: daysFromToday(date) };
            })
            .filter((x) => x.days <= SOON_DAYS)
            .sort((a, b) => a.days - b.days),
        [tasks]
      );
    
      const days = current?.date ? daysFromToday(current.date) : null;
      const countdown = current ? countdownText(days, current.type) : null;
      const emptyFolders = folders.filter((f) => f.picture_count === 0).length;
      const selectValue = current ? `${current.type}:${current.id}` : "";

       return (
          <div className="dashboard">
            <h1 className="dash-title">Dashboard</h1>
      
            {error && <p className="panel-error">{error}</p>}
            {loadingItems && <p className="panel-state">Loading...</p>}
      
            {/* No moves or trips yet */}
            {!loadingItems && !error && items.length === 0 && (
              <section className="dash-card dash-empty">
                <h2 className="dash-heading">Welcome to Packing Helper</h2>
                <p>Create your first move or trip to start your countdown and track your packing.</p>
                <Link to={ROUTES.moveTripSelector} className="btn btn-primary">
                  Create a move or trip
                </Link>
              </section>
            )}
      
            {!loadingItems && items.length > 0 && (
              <>
                {/* Switcher */}
                <div className="form-field dash-switcher">
                  <label htmlFor="dash-source">Showing</label>
                  <select
                    id="dash-source"
                    className="field-select"
                    value={selectValue}
                    onChange={handleSelect}
                  >
                    {moves.length > 0 && (
                      <optgroup label="Moves">
                        {items
                          .filter((i) => i.type === "move")
                          .map((i) => (
                            <option key={`move:${i.id}`} value={`move:${i.id}`}>
                              {i.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {trips.length > 0 && (
                      <optgroup label="Trips">
                        {items
                          .filter((i) => i.type === "trip")
                          .map((i) => (
                            <option key={`trip:${i.id}`} value={`trip:${i.id}`}>
                              {i.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
      
                {current && (
                  <div className="dash-grid">
                    {/* Countdown */}
                    <section
                     className={`dash-hero${days === 0 ? " dash-hero-today" : ""}`}
                    >
                      <p className="dash-hero-count">
                        <span className="dash-hero-number">{countdown.value}</span>
                        <span className="dash-hero-label">{countdown.label}</span>
                      </p>
                      <p className="dash-hero-meta">
                        {current.name}
                        {current.date && ` · ${formatDate(current.date)}`}
                      </p>
                    </section>
      
                    {/* Progress */}
                    <section className="dash-card dash-area-progress">
                      <h2 className="dash-heading">Progress</h2>
                      {loadingDetails ? (
                        <p className="panel-state">Loading...</p>
                      ) : total === 0 ? (
                        <p className="panel-state">
                          No tasks yet. <Link to={ROUTES.tasks}>Add your first task</Link>
                        </p>
                      ) : (
                        <>
                          <div
                            className="dash-progress"
                            role="progressbar"
                            aria-label="Tasks completed"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                          >
                            <div className="dash-progress-fill" style={{ width: `${percent}%` }} />
                          </div>
                          <p className="dash-progress-text">
                            {done} of {total} {total === 1 ? "task" : "tasks"} done
                          </p>
                        </>
                      )}
                    </section>

                    {/* Needs attention */}
                    <section className="dash-card">
                      <h2 className="dash-heading">Needs attention</h2>
                      {loadingDetails ? (
                        <p className="panel-state">Loading...</p>
                      ) : attention.length === 0 ? (
                        <p className="panel-state">
                          {total > 0 && done === total
                            ? "All tasks done. Nice work!"
                            : `Nothing due in the next ${SOON_DAYS} days.`}
                        </p>
                      ) : (
                        <>
                          <ul className="dash-list">
                            {attention.slice(0, MAX_ATTENTION).map(({ task, date, days: d }) => (
                              <li
                                key={task.id}
                                className={`dash-task${d < 0 ? " dash-task-overdue" : ""}`}
                              >
                                <label className="dash-task-label">
                                  <input
                                    type="checkbox"
                                    className="dash-checkbox"
                                    checked={task.completion_status}
                                    onChange={() => completeTask(task)}
                                  />
                                  <span className="dash-task-name">{task.task_name}</span>
                                </label>
                                <span className="dash-task-due">{dueLabel(d, date)}</span>
                              </li>
                            ))}
                          </ul>
                          {attention.length > MAX_ATTENTION && (
                            <p className="dash-more">+ {attention.length - MAX_ATTENTION} more</p>
                          )}
                        </>
                      )}
                      <Link to={ROUTES.tasks} className="dash-link">
                        View all tasks →
                      </Link>
                    </section>
      
                    {/* Picture folders */}
                    <section className="dash-card">
                      <h2 className="dash-heading">Picture folders</h2>
                      {loadingDetails ? (
                        <p className="panel-state">Loading...</p>
                      ) : folders.length === 0 ? (
                        <p className="panel-state">No picture folders yet.</p>
                      ) : (
                        <>
                          <ul className="dash-folders">
                            {folders.map((f) => (
                              <li key={f.id}>
                                <Link
                                  to={ROUTES.pictures}
                                  className={`dash-folder${
                                    f.picture_count === 0 ? " dash-folder-empty" : ""
                                  }`}
                                >
                                  <span className="dash-folder-name">{f.folder_name}</span>
                                  <span className="dash-folder-count">{f.picture_count}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {emptyFolders > 0 && (
                            <p className="dash-hint">
                              {emptyFolders} {emptyFolders === 1 ? "folder is" : "folders are"} still
                              empty.
                            </p>
                          )}
                        </>
                      )}
                      <Link to={ROUTES.pictures} className="dash-link">
                        Go to pictures →
                      </Link>
                    </section>
      
                    {/* Quick actions */}
                    <div className="dash-actions">
                      <Link to={ROUTES.tasks} className="btn btn-primary">
                        + Add task
                      </Link>
                      <Link to={ROUTES.pictures} className="btn btn-secondary">
                        + Add pictures
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }

export { toDateOnly, parseLocal, daysFromToday, formatDate, dueLabel, countdownText };