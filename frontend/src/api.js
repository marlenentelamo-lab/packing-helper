const API_BASE = "/api";

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const options = {
    method,
    credentials: "include",
    headers: { ...headers },
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      // File uploads: send the FormData as-is. Don't set Content-Type here,
      // the browser adds it along with the multipart boundary.
      options.body = body;
    } else {
      options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    let message = "Request failed";
    if (typeof payload === "string") {
      // Ignore HTML error pages (e.g. from Multer); they make an unreadable message
      if (payload && !payload.trim().startsWith("<")) message = payload;
    } else if (payload) {
      // Your backend sends { error: "..." }; keep .message as a fallback
      message = payload.error || payload.message || message;
    }
    throw new Error(message);
  }

  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData }),
  logout: () => request("/logout", { method: "POST" }),
};

export default api;