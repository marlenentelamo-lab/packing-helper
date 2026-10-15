import {
    countdownText,
    daysUntil,
    formatLong,
    FOLDER_PREVIEW,
  } from "./MovesTripsHelpers";

  const THUMBS_PER_FOLDER = 4;

  const smallUrl = (url) =>
  url.replace("/upload/", "/upload/w_160,h_160,c_fill,q_auto,f_auto/");

  function PictureCard({ item, folders, picturesByFolder, onOpen }) {
    const total = folders.length;
    const pictureTotal = folders.reduce((sum, f) => sum + Number(f.picture_count || 0), 0);
    const shown = folders.slice(0, FOLDER_PREVIEW);
    const hidden = total - shown.length;
  
    return (
      <section className="mt-card">
        <div className="mt-card-head">
          <span className={`mt-badge mt-badge-${item.type}`}>
            {item.type === "move" ? "Move" : "Trip"}
          </span>
          {item.date && (
            <span className="mt-countdown">{countdownText(daysUntil(item.date), item.type)}</span>
          )}
        </div>
  
        <h2 className="mt-name">{item.name}</h2>
        {item.date && <p className="mt-date">{formatLong(item.date)}</p>}
  
        <p className="pc-summary">
          {total} {total === 1 ? "folder" : "folders"} · {pictureTotal}{" "}
          {pictureTotal === 1 ? "picture" : "pictures"}
        </p>
  
        {total === 0 ? (
          <p className="mt-empty-tasks">No picture folders yet for this {item.type}.</p>
        ) : (
          <ul className="pc-folders">
            {shown.map((folder) => {
              const count = Number(folder.picture_count || 0);
              const pictures = picturesByFolder[folder.id] || [];
              const showMoreTile = pictures.length > THUMBS_PER_FOLDER;
              const thumbs = pictures.slice(0, showMoreTile ? THUMBS_PER_FOLDER - 1 : THUMBS_PER_FOLDER);
              const extra = pictures.length - thumbs.length;
  
              return (
                <li
                  key={folder.id}
                  className={count === 0 ? "pc-folder pc-folder-empty" : "pc-folder"}
                >
                  <div className="pc-folder-row">
                    <span className="pc-folder-name">{folder.folder_name}</span>
                    <span className="pc-folder-count">
                      {count === 0
                        ? "No pictures yet"
                        : `${count} ${count === 1 ? "picture" : "pictures"}`}
                    </span>
                  </div>
  
                  {pictures.length > 0 && (
                    <div className="pc-thumbs">
                      {thumbs.map((picture) => (
                        <img
                          key={picture.id}
                          className="pc-thumb"
                          src={smallUrl(picture.cloudinary_url)}
                          alt={`Stored in ${folder.folder_name}`}
                          loading="lazy"
                        />
                      ))}
                      {showMoreTile && <span className="pc-thumb pc-thumb-more">+{extra}</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
  
        {hidden > 0 && (
          <button type="button" className="mt-more" onClick={() => onOpen(item)}>
            See {hidden} more {hidden === 1 ? "folder" : "folders"}
          </button>
        )}
  
        <div className="mt-actions">
          <button type="button" className="btn btn-primary" onClick={() => onOpen(item)}>
            {total === 0 ? "Add folders" : "Open pictures"}
          </button>
        </div>
      </section>
    );
  }
  
  export default PictureCard;
  