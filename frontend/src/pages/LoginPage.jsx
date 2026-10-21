import React, { useContext, useState } from "react";
import axios from "axios";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import {
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  passwordStrength,
  suggestEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "../lib/validation";

const inputBase =
  "w-full p-2.5 bg-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm";
const buttonClass =
  "py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
const strengthColors = ["bg-red-500", "bg-red-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

const EyeIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {!open && <path d="M3 3l18 18" />}
  </svg>
);

// One labelled input with an error message underneath
const Field = ({ label, id, error, children }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm text-gray-300">
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
        {error}
      </p>
    )}
  </div>
);

// Password input with a show/hide (eye) button and a Caps Lock warning
const PasswordInput = ({ id, value, onChange, onBlur, error, autoComplete, placeholder }) => {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCaps = (e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          maxLength={MAX_PASSWORD_LENGTH}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputBase} pr-10 ${error ? "border-red-400" : "border-gray-500"}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {capsLock && <p className="text-xs text-yellow-400">Caps Lock is on</p>}
    </>
  );
};

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [serverEmailError, setServerEmailError] = useState("");

  const { login } = useContext(AuthContext);
  const isSignup = currState === "Sign up";

  // Errors for the current form. Login only checks that fields are filled
  // and the email looks right; strength rules apply to new passwords only.
  const errors = {
    fullName: isSignup ? validateName(fullName) : "",
    email: validateEmail(email) || serverEmailError,
    password: isSignup ? validatePassword(password) : password ? "" : "Please enter your password",
    confirmPassword:
      isSignup && (!confirmPassword ? "Please confirm your password" : confirmPassword !== password ? "Passwords don't match" : ""),
    agreed: isSignup && !agreed ? "Please accept the terms to continue" : "",
  };
  const showError = (field) => (touched[field] ? errors[field] : "");
  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const strength = passwordStrength(password);
  const emailSuggestion = isSignup && !validateEmail(email) ? suggestEmail(email) : "";

  const switchTo = (state) => {
    setCurrState(state);
    setIsDataSubmitted(false);
    setPassword("");
    setConfirmPassword("");
    setTouched({});
    setServerEmailError("");
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Sign up has two steps: details first, then bio
    if (isSignup && !isDataSubmitted) {
      const fields = ["fullName", "email", "password", "confirmPassword", "agreed"];
      setTouched(Object.fromEntries(fields.map((f) => [f, true])));
      if (fields.some((f) => errors[f])) return;

      // Ask the server whether the email domain is real and not already registered
      setSubmitting(true);
      try {
        const { data } = await axios.post("/api/auth/check-email", { email: email.trim() });
        if (!data.success) {
          setServerEmailError(data.message);
          return;
        }
      } catch {
        // If the check itself fails, carry on; signup validates again anyway
      } finally {
        setSubmitting(false);
      }
      setIsDataSubmitted(true);
      return;
    }

    if (!isSignup) {
      setTouched({ email: true, password: true });
      if (errors.email || errors.password) return;
    }

    setSubmitting(true);
    const credentials = isSignup
      ? { fullName: fullName.trim(), email: email.trim(), password, bio: bio.trim() }
      : { email: email.trim(), password };
    const ok = await login(isSignup ? "signup" : "login", credentials);
    setSubmitting(false);

    // Signup failed (e.g. email taken in the meantime): go back to the details step
    if (!ok && isSignup) setIsDataSubmitted(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl p-4">
      <img src={assets.logo_big} alt="QuickChat" className="w-[min(30vw,250px)] max-sm:w-32" />

      <form
        onSubmit={onSubmitHandler}
        noValidate
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-4 rounded-lg shadow-lg w-[min(100%,400px)]"
      >
        {isSignup && isDataSubmitted ? (
          <>
            <h2 className="font-medium text-2xl flex justify-between items-center">
              Add your bio
              <button
                type="button"
                aria-label="Back"
                onClick={() => setIsDataSubmitted(false)}
                className="cursor-pointer"
              >
                <img src={assets.arrow_icon} alt="" className="w-5" />
              </button>
            </h2>

            <textarea
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              rows={4}
              maxLength={200}
              className={`${inputBase} border-gray-500`}
              placeholder="Provide a short bio... (optional)"
              autoFocus
            />
            <p className="-mt-3 text-right text-xs text-gray-400">{bio.length}/200</p>

            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="font-medium text-2xl">{isSignup ? "Create an account" : "Welcome back"}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {isSignup ? "Sign up to start chatting" : "Log in to continue to QuickChat"}
              </p>
            </div>

            {isSignup && (
              <Field label="Full name" id="fullName" error={showError("fullName")}>
                <input
                  id="fullName"
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => touch("fullName")}
                  value={fullName}
                  type="text"
                  maxLength={MAX_NAME_LENGTH}
                  autoComplete="name"
                  placeholder="John Doe"
                  aria-invalid={!!showError("fullName")}
                  className={`${inputBase} ${showError("fullName") ? "border-red-400" : "border-gray-500"}`}
                />
              </Field>
            )}

            <Field label="Email" id="email" error={showError("email")}>
              <input
                id="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setServerEmailError("");
                }}
                onBlur={() => touch("email")}
                value={email}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                aria-invalid={!!showError("email")}
                className={`${inputBase} ${showError("email") ? "border-red-400" : "border-gray-500"}`}
              />
              {emailSuggestion && (
                <p className="text-xs text-gray-300">
                  Did you mean{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(emailSuggestion);
                      setServerEmailError("");
                    }}
                    className="text-violet-400 underline cursor-pointer"
                  >
                    {emailSuggestion}
                  </button>
                  ?
                </p>
              )}
            </Field>

            <Field label="Password" id="password" error={showError("password")}>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch("password")}
                error={showError("password")}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
              />
              {isSignup && password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= Math.max(strength.score, 1) ? strengthColors[strength.score] : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 w-14 text-right">{strength.label}</span>
                </div>
              )}
            </Field>

            {isSignup && (
              <Field label="Confirm password" id="confirmPassword" error={showError("confirmPassword")}>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => touch("confirmPassword")}
                  error={showError("confirmPassword")}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                />
              </Field>
            )}

            {isSignup && (
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      touch("agreed");
                    }}
                    className="accent-violet-500"
                  />
                  I agree to the terms of use & privacy policy.
                </label>
                {showError("agreed") && <p className="text-xs text-red-400">{errors.agreed}</p>}
              </div>
            )}

            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting
                ? isSignup
                  ? "Checking…"
                  : "Logging in…"
                : isSignup
                ? "Next"
                : "Login Now"}
            </button>

            <p className="text-sm text-gray-400">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => switchTo(isSignup ? "Login" : "Sign up")}
                className="font-medium text-violet-400 cursor-pointer hover:underline"
              >
                {isSignup ? "Login here" : "Sign up"}
              </button>
            </p>
          </>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
