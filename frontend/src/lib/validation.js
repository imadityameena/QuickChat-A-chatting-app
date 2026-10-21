// Client-side checks for the login / signup form.
// The server repeats these checks (backend/lib/validation.js), so keep them in sync.

const EMAIL_REGEX =
  /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_NAME_LENGTH = 50;

export function validateName(name) {
  const n = name.trim();
  if (!n) return "Please enter your name";
  if (n.length < 2) return "Name must be at least 2 characters";
  if (n.length > MAX_NAME_LENGTH) return `Name must be at most ${MAX_NAME_LENGTH} characters`;
  return "";
}

export function validateEmail(email) {
  const e = email.trim();
  if (!e) return "Please enter your email";
  if (e.length > 254 || !EMAIL_REGEX.test(e)) return "Please enter a valid email address";
  return "";
}

export function validatePassword(password) {
  if (!password) return "Please enter a password";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (password.length > MAX_PASSWORD_LENGTH)
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return "Use at least one letter and one number";
  return "";
}

// 0–4 score with a label, for the strength bar under the password field
export function passwordStrength(password) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length < MIN_PASSWORD_LENGTH) score = Math.min(score, 1);
  return { score, label: ["Too weak", "Weak", "Fair", "Good", "Strong"][score] };
}

// Spot common domain typos like "gmial.com" and suggest the fix
const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "protonmail.com",
  "rediffmail.com",
  "yahoo.co.in",
];

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

export function suggestEmail(email) {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!local || !domain || COMMON_DOMAINS.includes(domain)) return "";
  let best = "";
  let bestDist = 3;
  for (const d of COMMON_DOMAINS) {
    const dist = editDistance(domain, d);
    if (dist > 0 && dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best ? `${local}@${best}` : "";
}

// Put a name in standard form: "  aditya   MEENA " -> "Aditya Meena".
// Handles hyphens and apostrophes ("mary-jane o'brien" -> "Mary-Jane O'Brien")
// and leaves deliberate mixed case alone ("McDonald" stays "McDonald").
export function formatName(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split(/([-'’])/)
        .map((part) => {
          if (!part || /^[-'’]$/.test(part)) return part;
          const mixedCase = part !== part.toLowerCase() && part !== part.toUpperCase();
          const base = mixedCase ? part : part.toLowerCase();
          return base.charAt(0).toLocaleUpperCase() + base.slice(1);
        })
        .join("")
    )
    .join(" ");
}

// Usernames (same rules as backend/lib/validation.js)
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const USERNAME_REGEX = /^(?![.])(?!.*\.\.)[a-z0-9._]+(?<![.])$/;

export const normalizeUsername = (username) =>
  String(username ?? "").trim().replace(/^@/, "").toLowerCase();

export function validateUsername(username) {
  if (!username) return "Please choose a username";
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX)
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters`;
  if (!USERNAME_REGEX.test(username))
    return "Only lowercase letters, numbers, dots and underscores (no dot at the start or end)";
  return "";
}

// "Aditya Meena" -> "aditya.meena"
export function usernameFromName(name) {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, USERNAME_MAX)
    .replace(/\.+$/, "");
}

// Login accepts an email or a username
export function validateIdentifier(value) {
  const v = value.trim();
  if (!v) return "Please enter your email or username";
  if (v.includes("@") && !v.startsWith("@")) return validateEmail(v);
  return validateUsername(normalizeUsername(v)) ? "Please enter a valid username" : "";
}
