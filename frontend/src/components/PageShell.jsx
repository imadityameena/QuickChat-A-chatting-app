import React from "react";
import assets from "../assets/assets";
import ViewTabs from "./ViewTabs";

// Layout for the Discover and Requests pages: header + scrollable card area.
// On phones the sidebar is hidden, so the tabs are shown here instead.
const PageShell = ({ title, subtitle, toolbar, children }) => (
  <section className="h-full min-h-0 flex flex-col text-white">
    <header className="shrink-0 px-4 sm:px-6 lg:px-8 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 pb-4 border-b border-white/10">
      <div className="md:hidden flex items-center justify-between mb-4">
        <img src={assets.logo} alt="QuickChat" className="max-w-32" />
      </div>
      <ViewTabs className="md:hidden mb-5" />

      <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
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
      <div className="w-14 h-14 rounded-full bg-violet-600/20 text-violet-300 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <p className="text-white font-medium">{title}</p>
    {text && <p className="text-sm text-gray-400 mt-1 max-w-sm">{text}</p>}
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
        className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
          value === id
            ? "bg-white text-[#1a1730] border-white font-medium"
            : "border-white/20 text-gray-300 hover:border-white/50 hover:text-white"
        }`}
      >
        {label}
        {count !== undefined && <span className="ml-1 opacity-70">{count}</span>}
      </button>
    ))}
  </div>
);

export default PageShell;
