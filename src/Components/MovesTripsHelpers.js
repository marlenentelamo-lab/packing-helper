export const PREVIEW_LIMIT = 4;

export function parseDate(str) {
  const [y, m, d] = String(str).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(str) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDate(str) - today) / 86400000);
}

export function formatLong(str) {
  return parseDate(str).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShort(str) {
  return parseDate(str).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function countdownText(days, type) {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "1 day to go";
  if (days === 0) return type === "move" ? "Today is moving day!" : "Today is travel day!";
  const ago = Math.abs(days);
  return `${ago} ${ago === 1 ? "day" : "days"} since this ${type}`;
}

export function isOverdue(task) {
  return !task.completion_status && !!task.due_date && daysUntil(task.due_date) < 0;
}

export function previewTasks(tasks, limit = PREVIEW_LIMIT) {
  const open = tasks
    .filter((t) => !t.completion_status)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return String(a.due_date).localeCompare(String(b.due_date));
    });
  const finished = tasks.filter((t) => t.completion_status);
  return [...open, ...finished].slice(0, limit);
}

export const GROUP_LIMIT = 10;
