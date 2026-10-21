import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { ArrowLeftIcon } from "./icons";
import { LEGAL } from "../lib/legal";

// Shared page frame for the Privacy Policy and Terms of Service
const LegalLayout = ({ title, children }) => {
  const navigate = useNavigate();

  // Go back if we came from inside the app, otherwise go home
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12">
      <article className="mx-auto w-full max-w-3xl bg-surface text-fg border border-line rounded-2xl shadow-xl shadow-black/10 p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            type="button"
            aria-label="Go back"
            onClick={goBack}
            className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-surface-3 cursor-pointer"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <Logo />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted mt-2">Last updated: {LEGAL.lastUpdated}</p>

        <div className="mt-8 text-[15px] leading-relaxed text-fg">{children}</div>

        <footer className="mt-10 pt-6 border-t border-line text-sm text-muted flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/privacy" className="hover:text-fg hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-fg hover:underline">Terms of Service</Link>
          <a href={`mailto:${LEGAL.contactEmail}`} className="hover:text-fg hover:underline">
            {LEGAL.contactEmail}
          </a>
        </footer>
      </article>
    </div>
  );
};

// A numbered section with a heading
export const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    <div className="flex flex-col gap-3 text-muted">{children}</div>
  </section>
);

export const List = ({ items }) => (
  <ul className="list-disc pl-5 flex flex-col gap-1.5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default LegalLayout;
