import User from "../models/user.model.js";
import { USERNAME_MAX, USERNAME_MIN, usernameFromName, validateUsername } from "./validation.js";

// A few free usernames close to `base`, e.g. aditya.meena7, aditya.meena_42
export const suggestUsernames = async (base, count = 3) => {
  let root = usernameFromName(base) || "user";
  if (root.length < USERNAME_MIN) root = `${root}${"0".repeat(USERNAME_MIN - root.length)}`;
  root = root.slice(0, USERNAME_MAX - 4).replace(/\.+$/, "");

  const candidates = new Set();
  if (!validateUsername(root)) candidates.add(root);
  while (candidates.size < count * 4) {
    const n = Math.floor(Math.random() * 9999) + 1;
    candidates.add(Math.random() < 0.5 ? `${root}${n}` : `${root}_${n}`);
  }

  const list = [...candidates].filter((u) => !validateUsername(u));
  const taken = new Set(
    (await User.find({ username: { $in: list } }, { username: 1 }).lean()).map((u) => u.username)
  );
  return list.filter((u) => !taken.has(u)).slice(0, count);
};
