import { useEffect, useState } from "react";

// Theme mode: "system" follows the device, or force "light" / "dark".
// index.html applies the saved mode before the first paint.
const STORAGE_KEY = "theme";
const media = () => window.matchMedia("(prefers-color-scheme: light)");

const readMode = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
};

const apply = (mode) => {
  const dark = mode === "dark" || (mode === "system" && !media().matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0c0a13" : "#f3f2f8");
};

export function useTheme() {
  const [mode, setMode] = useState(readMode);

  useEffect(() => {
    apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // private mode etc.: the theme just won't be remembered
    }
    if (mode !== "system") return;
    // follow the device while in system mode
    const mq = media();
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return [mode, setMode];
}
