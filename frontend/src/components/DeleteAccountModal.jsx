import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { button, input } from "../lib/ui";
import { TrashIcon } from "./icons";

// Confirmation popup for permanently deleting your account.
// Asks for your password and for you to type "DELETE".
const DeleteAccountModal = ({ open, onClose }) => {
  const { deleteAccount } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const passwordRef = useRef(null);

  // Reset the form each time it opens, focus the password, close on Escape
  useEffect(() => {
    if (!open) return;
    setPassword("");
    setConfirmText("");
    setError("");
    passwordRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && !deleting && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const canDelete = password && confirmText.trim().toUpperCase() === "DELETE" && !deleting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    const result = await deleteAccount(password);
    // On success the user is logged out and this page goes away
    if (!result.ok) {
      setError(result.message);
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !deleting && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-surface border border-line shadow-2xl text-fg p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-full bg-danger-soft text-danger flex items-center justify-center">
            <TrashIcon className="w-5 h-5" />
          </span>
          <div>
            <h2 id="delete-account-title" className="text-lg font-semibold">Delete your account?</h2>
            <p className="text-sm text-muted mt-1">This is permanent and can't be undone.</p>
          </div>
        </div>

        <ul className="text-sm text-muted list-disc pl-5 flex flex-col gap-1">
          <li>Your profile, username and photo will be deleted.</li>
          <li>All your chats and shared photos will be deleted, for you and the people you talked to.</li>
          <li>You'll be removed from your friends' lists, and pending friend requests will be cancelled.</li>
        </ul>

        <div className="flex flex-col gap-1">
          <label htmlFor="delete-password" className="text-sm font-medium">Your password</label>
          <input
            ref={passwordRef}
            id="delete-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className={`${input} ${error ? "border-danger" : "border-line"}`}
          />
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="delete-confirm" className="text-sm font-medium">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={`${input} border-line`}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={deleting} className={button.secondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canDelete}
            className={`${button.primary} !bg-danger hover:!brightness-110 !text-white`}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeleteAccountModal;
