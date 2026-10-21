import React, { useEffect, useState } from "react";
import axios from "axios";
import { normalizeUsername, USERNAME_MAX, validateUsername } from "../lib/validation";
import { input } from "../lib/ui";

// Username field with a live "available / taken" check and suggestions.
// Reports its state through onStatusChange: "idle" | "checking" | "available" | "taken" | "invalid"
const UsernameInput = ({ id = "username", value, onChange, onBlur, name, currentUsername, showErrors, onStatusChange }) => {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const username = normalizeUsername(value);
  const formatError = validateUsername(username);

  useEffect(() => {
    setSuggestions([]);
    if (!username || formatError) {
      setStatus(username ? "invalid" : "idle");
      setMessage(formatError);
      return;
    }
    if (currentUsername && username === currentUsername) {
      setStatus("available");
      setMessage("");
      return;
    }

    setStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get("/api/auth/check-username", {
          params: { username, name },
          signal: controller.signal,
        });
        setStatus(data.available ? "available" : "taken");
        setMessage(data.available ? "" : data.message);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        // If the check fails, don't block the form; the server checks again on save
        if (!axios.isCancel(err)) {
          setStatus("idle");
          setMessage("");
        }
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `name` only feeds the suggestions, so it shouldn't retrigger the check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, formatError, currentUsername]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const showError = (status === "taken" || (status === "invalid" && showErrors)) && message;
  const borderClass = showError ? "border-danger" : status === "available" ? "border-online" : "border-line";

  return (
    <>
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-subtle pointer-events-none">@</span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, "").toLowerCase())}
          onBlur={onBlur}
          type="text"
          maxLength={USERNAME_MAX + 1}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="your.username"
          aria-invalid={!!showError}
          className={`${input} pl-7 pr-9 ${borderClass}`}
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-sm" aria-hidden>
          {status === "checking" && (
            <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
          {status === "available" && <span className="text-success-text">✓</span>}
          {status === "taken" && <span className="text-danger">✕</span>}
        </span>
      </div>

      {status === "available" && username !== currentUsername && (
        <p className="text-xs text-success-text">@{username} is available</p>
      )}
      {showError && (
        <p role="alert" className="text-xs text-danger">
          {message}
        </p>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          Try:
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="px-2.5 py-1 rounded-full bg-accent-soft text-accent-text hover:bg-accent hover:text-accent-fg cursor-pointer transition-colors"
            >
              @{s}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default UsernameInput;
