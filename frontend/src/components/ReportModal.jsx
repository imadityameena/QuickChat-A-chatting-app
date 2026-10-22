import React, { useContext, useEffect, useRef, useState } from "react";
import { FriendContext } from "../../context/FriendContext";
import { button, input } from "../lib/ui";
import { FlagIcon } from "./icons";

const REASONS = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "inappropriate", label: "Inappropriate or offensive content" },
  { id: "impersonation", label: "Pretending to be someone else" },
  { id: "underage", label: "May be under 13" },
  { id: "other", label: "Something else" },
];

// Popup for reporting a user, with an option to block them too
const ReportModal = () => {
  const { reportTarget: user, closeReport, reportUser, busy } = useContext(FriendContext);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const firstRef = useRef(null);

  // Fresh form each time it opens; close with Escape
  useEffect(() => {
    if (!user) return;
    setReason("");
    setDetails("");
    setAlsoBlock(true);
    firstRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeReport();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [user, closeReport]);

  if (!user) return null;

  const sending = !!busy[user._id];
  const needsDetails = reason === "other" && !details.trim();
  const canSend = reason && !needsDetails && !sending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    const ok = await reportUser(user, { reason, details: details.trim(), block: alsoBlock });
    if (ok) closeReport();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !sending && closeReport()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-surface border border-line shadow-2xl text-fg p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-full bg-danger-soft text-danger flex items-center justify-center">
            <FlagIcon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 id="report-title" className="text-lg font-semibold break-words">Report {user.fullName}</h2>
            <p className="text-sm text-muted mt-1">
              They won't know you reported them. We'll review this and take action if they broke our Terms.
            </p>
          </div>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium mb-1.5">What's the problem?</legend>
          {REASONS.map((r, i) => (
            <label
              key={r.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                reason === r.id ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-3"
              }`}
            >
              <input
                ref={i === 0 ? firstRef : undefined}
                type="radio"
                name="report-reason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="accent-[var(--accent)] w-4 h-4"
              />
              {r.label}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="report-details" className="text-sm font-medium">
            Details {reason === "other" ? "" : <span className="text-subtle font-normal">(optional)</span>}
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell us what happened"
            className={`${input} border-line resize-none`}
          />
          <p className="text-right text-xs text-subtle">{details.length}/1000</p>
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={alsoBlock}
            onChange={(e) => setAlsoBlock(e.target.checked)}
            className="accent-[var(--accent)] w-4 h-4 mt-0.5 shrink-0"
          />
          <span>
            Also block {user.fullName}
            <span className="block text-xs text-muted">
              They'll be removed from your friends and won't be able to find you or send you requests.
            </span>
          </span>
        </label>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={closeReport} disabled={sending} className={button.secondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSend}
            className={`${button.primary} !bg-danger hover:!brightness-110 !text-white`}
          >
            {sending ? "Sending…" : "Send report"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportModal;
