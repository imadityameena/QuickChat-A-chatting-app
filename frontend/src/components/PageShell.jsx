import React from "react";
import Logo from "./Logo";
import ViewTabs from "./ViewTabs";

// Layout for the Discover and Requests pages: header + scrollable card area.
// On phones the sidebar is hidden, so the logo and tabs are shown here instead.
const PageShell = ({ title, subtitle, toolbar, children }) => (
  <section className="h-full min-h-0 flex flex-col text-fg">
    <header className="shrink-0 px-4 sm:px-6 lg:px-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 pb-4 border-b border-line bg-surface/70 backdrop-blur-md">
      <Logo className="md:hidden mb-4" />
      <ViewTabs className="md:hidden mb-5" />

      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      {toolbar && <div className="mt-4">{toolbar}</div>}
    </header>

    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  </section>
);

// Responsive grid for profile cards
export const CardGrid = ({ children }) => (
  <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
    {children}
  </div>
);

// Centered message for empty pages
export const EmptyState = ({ Icon, title, text, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    {Icon && (
      <div className="w-14 h-14 rounded-full bg-accent-soft text-accent-text flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <p className="font-semibold">{title}</p>
    {text && <p className="text-sm text-muted mt-1 max-w-sm">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// Pill-shaped filter buttons, e.g. All / Online / Sent
export const FilterChips = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(({ id, label, count }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        aria-pressed={value === id}
        className={`text-sm px-3.5 py-1.5 rounded-full border cursor-pointer transition-colors ${
          value === id
            ? "bg-fg text-app border-fg font-medium"
            : "border-line bg-surface text-muted hover:text-fg hover:border-muted"
        }`}
      >
        {label}
        {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
      </button>
    ))}
  </div>
);

export default PageShell;
