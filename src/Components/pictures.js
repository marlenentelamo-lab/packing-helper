import { useEffect, useState } from 'react';
import { api } from '../api';
import FolderList from './FolderList';
import FolderView from './FolderView';

export default function PicturesPage() {
  const [moves, setMoves] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/moves'), api.get('/trips')])
      .then(([m, t]) => {
        setMoves(m);
        setTrips(t);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (e) => {
    setOpenFolder(null); // changing move/trip always returns to the folder list
    if (!e.target.value) {
      setSelected(null);
      return;
    }
    const [type, id] = e.target.value.split(':');
    setSelected({ type, id }); // keep id as a string so UUIDs work too
  };

  const selectValue = selected ? `${selected.type}:${selected.id}` : '';
  const nothingExists = !loading && !error && moves.length === 0 && trips.length === 0;

  return (
    <div className="pictures-page">
      <h1 className="pictures-title">Pictures</h1>

      {loading && <p className="panel-state">Loading...</p>}
      {error && <p className="panel-error">{error}</p>}
      {nothingExists && (
        <p className="panel-state">Create a move or trip first, then come back to add pictures.</p>
      )}

      {!loading && !nothingExists && !error && (
        <>
          <div className="form-field">
            <label htmlFor="pictures-source">Pictures for</label>
            <select
              id="pictures-source"
              className="field-select"
              value={selectValue}
              onChange={handleSelect}
            >
              <option value="">Choose a move or trip</option>
              {moves.length > 0 && (
                <optgroup label="Moves">
                  {moves.map((m) => (
                    <option key={`move:${m.id}`} value={`move:${m.id}`}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {trips.length > 0 && (
                <optgroup label="Trips">
                  {trips.map((t) => (
                    <option key={`trip:${t.id}`} value={`trip:${t.id}`}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {!selected && (
            <p className="panel-state">Choose a move or trip to see its folders.</p>
          )}

          {selected && !openFolder && (
            <FolderList selected={selected} onOpen={setOpenFolder} />
          )}

          {selected && openFolder && (
            <FolderView folder={openFolder} onBack={() => setOpenFolder(null)} />
          )}
        </>
      )}
    </div>
  );
}
