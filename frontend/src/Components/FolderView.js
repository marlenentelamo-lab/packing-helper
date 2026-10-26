import { useEffect, useState } from 'react';
import { api } from '../api';

const MAX_FILES = 10;          // must match upload.array('images', 10) on the backend
const MAX_SIZE_MB = 5;         // must match the Multer fileSize limit

// Ask Cloudinary for a small, cropped, compressed version for the grid.
// The full-size original opens when the thumbnail is clicked.
const thumbUrl = (url) =>
  url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/');

export default function FolderView({ folder, onBack }) {
  const [pictures, setPictures] = useState([]);
  const [files, setFiles] = useState([]);
  const [inputKey, setInputKey] = useState(0); // changing this clears the file input
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/pictures?folder_id=${encodeURIComponent(folder.id)}`)
      .then(setPictures)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [folder.id]);

  const handleFileChange = (e) => {
    const chosen = [...e.target.files];
    setError('');

    if (chosen.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} pictures at a time.`);
      setFiles([]);
      setInputKey((k) => k + 1);
      return;
    }
    const tooBig = chosen.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than ${MAX_SIZE_MB} MB. Choose a smaller picture.`);
      setFiles([]);
      setInputKey((k) => k + 1);
      return;
    }
    setFiles(chosen);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('folder_id', folder.id); // this is what ties the pictures to THIS folder
      files.forEach((file) => formData.append('images', file)); // 'images' must match upload.array('images')

      const saved = await api.upload('/pictures', formData);
      setPictures([...pictures, ...saved]);
      setFiles([]);
      setInputKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (picture) => {
    if (!window.confirm('Delete this picture? This can\'t be undone.')) return;
    setError('');
    try {
      await api.del(`/pictures/${picture.id}`);
      setPictures(pictures.filter((p) => p.id !== picture.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="pictures-heading-row">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back to folders
        </button>
        <h2 className="pictures-folder-name">{folder.folder_name}</h2>
      </div>

      <form className="pictures-upload" onSubmit={handleUpload}>
        <div className="form-field">
          <label htmlFor="picture-files">Add pictures to {folder.folder_name}</label>
          <input
            key={inputKey}
            id="picture-files"
            className="field-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </div>
        <p className="pictures-upload-hint">
          Up to {MAX_FILES} pictures at a time, {MAX_SIZE_MB} MB each.
          {files.length > 0 && ` ${files.length} selected.`}
        </p>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={uploading || files.length === 0}
        >
          {uploading
            ? 'Uploading...'
            : files.length > 1
            ? `Upload ${files.length} pictures`
            : 'Upload picture'}
        </button>
      </form>

      {error && <p className="panel-error">{error}</p>}
      {loading && <p className="panel-state">Loading pictures...</p>}

      {!loading && pictures.length === 0 && !error && (
        <p className="panel-state">No pictures in this folder yet.</p>
      )}

      {!loading && pictures.length > 0 && (
        <ul className="thumb-grid">
          {pictures.map((picture) => (
            <li key={picture.id} className="thumb">
              <a href={picture.cloudinary_url} target="_blank" rel="noreferrer">
                <img
                  src={thumbUrl(picture.cloudinary_url)}
                  alt={`Stored in ${folder.folder_name}`}
                  loading="lazy"
                />
              </a>
              <button
                type="button"
                className="btn btn-delete"
                onClick={() => handleDelete(picture)}
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
