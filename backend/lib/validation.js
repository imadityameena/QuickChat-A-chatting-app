import { promises as dns } from "dns";

// Practical email format check: local@domain.tld, no spaces, no double dots,
// labels can't start/end with "-", TLD is 2+ letters.
const EMAIL_REGEX =
  /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores anything past 72 bytes
export const MAX_NAME_LENGTH = 50;

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

export const isValidEmailFormat = (email) =>
  typeof email === "string" && email.length <= 254 && EMAIL_REGEX.test(email);

// Returns an error message, or null if the password is acceptable.
export const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number";
  }
  return null;
};

// Checks that the email's domain exists and can receive mail.
// Network problems (timeouts etc.) are treated as "ok" so a flaky DNS
// server never blocks someone from signing up.
const domainCache = new Map();

export const emailDomainCanReceiveMail = async (email) => {
  const domain = email.split("@")[1];
  if (domainCache.has(domain)) return domainCache.get(domain);

  let ok = true;
  try {
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    ok = records.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      // No MX record: mail falls back to the A record if the domain exists
      try {
        await dns.resolve4(domain);
      } catch {
        ok = false;
      }
    }
  }

  if (domainCache.size > 1000) domainCache.clear();
  domainCache.set(domain, ok);
  return ok;
};

// Full email check used by signup. Returns an error message or null.
export const validateEmail = async (email) => {
  if (!isValidEmailFormat(email)) return "Please enter a valid email address";
  if (!(await emailDomainCanReceiveMail(email))) {
    return "This email domain doesn't exist or can't receive mail";
  }
  return null;
};
