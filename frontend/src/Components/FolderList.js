import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function FolderList({ selected, onOpen }) {
  const [folders, setFolders] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // The backend wants ?move_id=... or ?trip_id=... (exactly one)
  const idKey = selected.type === 'move' ? 'move_id' : 'trip_id';

  // Reload whenever the user picks a different move or trip
  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/picture-folders?${idKey}=${encodeURIComponent(selected.id)}`)
      .then(setFolders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selected.type, selected.id, idKey]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setCreating(true);
    setError('');
    try {
      // The move/trip id comes from state, so the user never types it
      const newFolder = await api.post('/picture-folders', {
        folder_name: folderName.trim(),
        [idKey]: selected.id,
      });
      setFolders([...folders, newFolder]);
      setFolderName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (folder) => {
    const ok = window.confirm(
      `Delete "${folder.folder_name}" and all ${folder.picture_count} of its pictures? This can't be undone.`
    );
    if (!ok) return;
    setError('');
    try {
      await api.del(`/picture-folders/${folder.id}`);
      setFolders(folders.filter((f) => f.id !== folder.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <form className="pictures-create" onSubmit={handleCreate}>
        <div className="form-field">
          <label htmlFor="new-folder-name">New folder</label>
          <input
            id="new-folder-name"
            className="field-input"
            type="text"
            placeholder="e.g. Kitchen"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={creating || !folderName.trim()}
        >
          {creating ? 'Creating...' : 'Create folder'}
        </button>
      </form>

      {error && <p className="panel-error">{error}</p>}
      {loading && <p className="panel-state">Loading folders...</p>}

      {!loading && folders.length === 0 && !error && (
        <p className="panel-state">No folders yet. Create one above to start adding pictures.</p>
      )}

      {!loading && folders.length > 0 && (
        <ul className="folder-grid">
          {folders.map((folder) => (
            <li key={folder.id} className="folder-card">
              <button
                type="button"
                className="folder-card-open"
                onClick={() => onOpen(folder)}
              >
                <span className="folder-card-name">{folder.folder_name}</span>
                <span className="folder-card-count">
                  {folder.picture_count} {folder.picture_count === 1 ? 'picture' : 'pictures'}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-delete"
                onClick={() => handleDelete(folder)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
