import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import FolderList from './FolderList';
import FolderView from './FolderView';
import PictureCard from './PictureCard';
import { daysUntil, FOLDER_PREVIEW } from './MovesTripsHelpers';

const DATE_FIELD = { move: 'target_date', trip: 'trip_date' };

function sortCards(cards) {
  const date = (c) => c.item.date;
  return [
    ...cards
      .filter((c) => date(c) && daysUntil(date(c)) >= 0)
      .sort((a, b) => date(a).localeCompare(date(b))),
    ...cards
      .filter((c) => date(c) && daysUntil(date(c)) < 0)
      .sort((a, b) => date(b).localeCompare(date(a))),
    ...cards.filter((c) => !date(c)),
  ];
}

export default function PicturesPage() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [moves, trips] = await Promise.all([api.get('/moves'), api.get('/trips')]);
      const rows = [
        ...moves.map((row) => ({ type: 'move', row })),
        ...trips.map((row) => ({ type: 'trip', row })),
      ];

      const loaded = await Promise.all(
        rows.map(async ({ type, row }) => {
          const folders = await api.get(`/picture-folders?${type}_id=${row.id}`);

          const picturesByFolder = {};
          await Promise.all(
            folders
              .slice(0, FOLDER_PREVIEW)
              .filter((f) => Number(f.picture_count || 0) > 0)
              .map(async (f) => {
                try {
                  picturesByFolder[f.id] = await api.get(
                    `/pictures?folder_id=${encodeURIComponent(f.id)}`
                  );
                } catch (err) {
                  console.error(err);
                }
              })
          );

          return {
            item: {
              type,
              id: String(row.id), // keep id as a string so UUIDs work too
              name: row.name,
              date: String(row[DATE_FIELD[type]] || '').slice(0, 10),
            },
            folders,
            picturesByFolder,
          };
        })
      );
      setCards(sortCards(loaded));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = (item) => {
    setOpenFolder(null);
    setSelected({ type: item.type, id: item.id });
  };

  const backToCards = () => {
    setOpenFolder(null);
    setSelected(null);
    load();
  };

  const nothingExists = !loading && !error && cards.length === 0;
  const selectedCard = selected
    ? cards.find((c) => c.item.type === selected.type && c.item.id === selected.id)
    : null;

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
          {!selected && (
            <div className="mt-grid">
              {cards.map((card) => (
                <PictureCard
                  key={`${card.item.type}-${card.item.id}`}
                  item={card.item}
                  folders={card.folders}
                  picturesByFolder={card.picturesByFolder}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          )}

          {selected && (
            <>
              <div className="pc-selected-head">
                <button type="button" className="btn btn-secondary" onClick={backToCards}>
                  ← All moves &amp; trips
                </button>
                {selectedCard && <h2 className="pc-selected-title">{selectedCard.item.name}</h2>}
              </div>

              {!openFolder && <FolderList selected={selected} onOpen={setOpenFolder} />}

              {openFolder && (
                <FolderView folder={openFolder} onBack={() => setOpenFolder(null)} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
