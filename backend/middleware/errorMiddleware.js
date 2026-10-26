function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "MulterError") {
    const isTooLarge = error.code === "LIMIT_FILE_SIZE";
    const isUnsupportedField = error.code === "LIMIT_UNEXPECTED_FILE";
    const statusCode = isTooLarge ? 413 : 400;
    const message = isTooLarge
      ? "Uploaded file exceeds the 5 MB limit"
      : isUnsupportedField
        ? "Unexpected file field"
        : "Invalid file upload";

    return res.status(statusCode).json({ error: message });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  if (error.statusCode === 415) {
    return res.status(415).json({ error: error.message });
  }

  console.error("Unhandled request error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

module.exports = errorMiddleware;