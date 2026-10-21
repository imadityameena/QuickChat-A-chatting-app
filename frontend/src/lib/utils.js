export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// "14:05"
export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// "Today", "Yesterday" or "Mon, 3 Mar"
export function formatDayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

// Short time for the sidebar: time if today, otherwise the day label
export function formatSidebarTime(date) {
  return isSameDay(date, new Date()) ? formatMessageTime(date) : formatDayLabel(date);
}

// Prefer the server's error message over axios' generic one
export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong";
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

// Returns an error message, or null if the file is a usable image
export function validateImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return "Please select an image file";
  if (file.size > MAX_IMAGE_SIZE) return "Image must be smaller than 5MB";
  return null;
}
