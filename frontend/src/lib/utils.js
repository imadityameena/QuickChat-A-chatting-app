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

// "last seen just now", "last seen 5 min ago", "last seen today at 14:05", "last seen Mon, 3 Mar"
export function formatLastSeen(date) {
  if (!date) return "Offline";
  const d = new Date(date);
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  const day = formatDayLabel(d);
  if (day === "Today" || day === "Yesterday") {
    return `Last seen ${day.toLowerCase()} at ${formatMessageTime(d)}`;
  }
  return `Last seen ${day}`;
}

// "just now", "5m ago", "3h ago", "2d ago", or the date for older times
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDayLabel(date);
}

// How long someone has been a member: "New" (under a day), "3 days", "4 months", "2 years"
export function memberDuration(date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days < 1) return "New";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

// "March 2026"
export function formatMonthYear(date) {
  return new Date(date).toLocaleDateString([], { month: "long", year: "numeric" });
}
