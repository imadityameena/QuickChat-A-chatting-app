// Shared class strings so buttons and inputs look the same everywhere

const btnBase =
  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const button = {
  primary: `${btnBase} bg-accent hover:bg-accent-hover text-accent-fg`,
  success: `${btnBase} bg-success hover:brightness-110 text-white`,
  secondary: `${btnBase} border border-line bg-surface-2 hover:bg-surface-3 text-fg`,
  ghost: `${btnBase} border border-line text-fg hover:border-danger hover:text-danger`,
  danger: `${btnBase} text-danger hover:bg-danger-soft`,
  // round icon-only button, e.g. decline (✕)
  iconGhost:
    "inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full border border-line text-muted hover:border-danger hover:text-danger cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
};

// Buttons that fill their slot on cards and in the profile popup
export const cardButton = {
  primary: `${button.primary} flex-1`,
  success: `${button.success} flex-1`,
  ghost: `${button.ghost} flex-1`,
};

// Large full-width button for forms
export const formButton =
  "w-full h-11 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export const input =
  "w-full px-3 py-2.5 rounded-lg bg-surface-2 border text-fg placeholder:text-subtle text-base sm:text-sm focus:outline-none focus:ring-4 focus:ring-accent-soft focus:border-accent transition-colors";
