import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { readFileAsDataURL, validateImageFile } from "../lib/utils";
import UsernameInput from "../components/UsernameInput";
import Logo from "../components/Logo";
import { ArrowLeftIcon } from "../components/icons";
import { formButton, input } from "../lib/ui";
import {
  formatName,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  normalizeUsername,
  passwordStrength,
  suggestEmail,
  usernameFromName,
  validateEmail,
  validateIdentifier,
  validateName,
  validatePassword,
  validateUsername,
} from "../lib/validation";

const inputBase = input;
const buttonClass = formButton;
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
    <label htmlFor={id} className="text-sm font-medium text-fg">
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} role="alert" className="text-xs text-danger">
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
          className={`${inputBase} pr-10 ${error ? "border-danger" : "border-line"}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-subtle hover:text-fg cursor-pointer"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {capsLock && <p className="text-xs text-amber-500">Caps Lock is on</p>}
    </>
  );
};

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [serverEmailError, setServerEmailError] = useState("");

  const { login } = useContext(AuthContext);
  const isSignup = currState === "Sign up";

  // Preview URL for the chosen profile picture (cleaned up when it changes)
  useEffect(() => {
    if (!photo) return setPhotoPreview(null);
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    const error = validateImageFile(file);
    if (error) return toast.error(error);
    setPhoto(file);
  };

  // Errors for the current form. Login only checks that fields are filled
  // and the email looks right; strength rules apply to new passwords only.
  const errors = {
    fullName: isSignup ? validateName(fullName) : "",
    username: isSignup
      ? validateUsername(normalizeUsername(username)) ||
        (usernameStatus === "taken" ? "This username is already taken" : "")
      : "",
    // On login this field takes an email or a username
    email: isSignup ? validateEmail(email) || serverEmailError : validateIdentifier(email),
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
      const fields = ["fullName", "username", "email", "password", "confirmPassword", "agreed"];
      setTouched(Object.fromEntries(fields.map((f) => [f, true])));
      if (fields.some((f) => errors[f])) return;
      if (usernameStatus === "checking") {
        toast("Still checking your username, try again in a moment");
        return;
      }

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
      ? {
          fullName: formatName(fullName),
          username: normalizeUsername(username),
          email: email.trim(),
          password,
          bio: bio.trim(),
        }
      : { identifier: email.trim(), password };
    if (isSignup && photo) {
      try {
        credentials.profilePic = await readFileAsDataURL(photo);
      } catch (err) {
        toast.error(err.message);
        setSubmitting(false);
        return;
      }
    }
    const ok = await login(isSignup ? "signup" : "login", credentials);
    setSubmitting(false);

    // Signup failed (e.g. email taken in the meantime): go back to the details step
    if (!ok && isSignup) setIsDataSubmitted(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center gap-10 lg:gap-20 max-md:flex-col p-4 py-10">
      {/* Brand side */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
        <Logo size="lg" className="max-md:hidden" />
        <Logo className="md:hidden" />
        <p className="max-md:hidden mt-5 text-2xl font-semibold leading-snug text-fg">
          Chat with your friends, in real time.
        </p>
        <p className="max-md:hidden mt-3 text-muted">
          Find people, send a friend request, and start talking once they accept.
        </p>
      </div>

      <form
        onSubmit={onSubmitHandler}
        noValidate
        className="bg-surface text-fg border border-line p-6 sm:p-8 flex flex-col gap-4 rounded-2xl shadow-xl shadow-black/10 w-[min(100%,420px)]"
      >
        {isSignup && isDataSubmitted ? (
          <>
            <h2 className="font-semibold text-2xl flex justify-between items-center">
              Almost done
              <button
                type="button"
                aria-label="Back"
                onClick={() => setIsDataSubmitted(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-surface-3 cursor-pointer"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            </h2>

            {/* Optional profile picture */}
            <div className="flex items-center gap-4">
              <label htmlFor="signup-photo" className="relative cursor-pointer shrink-0 group" title="Choose a profile picture">
                <img
                  src={photoPreview || assets.avatar_icon}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-line bg-surface-2 group-hover:border-accent transition-colors"
                />
                <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent text-accent-fg border-2 border-surface flex items-center justify-center text-sm">
                  {photo ? "✎" : "+"}
                </span>
              </label>
              <input
                id="signup-photo"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePhotoChange}
                hidden
              />
              <div className="text-sm min-w-0">
                <p className="font-medium">Profile picture</p>
                <p className="text-muted text-xs">Optional · JPG, PNG or WebP up to 5MB</p>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="mt-1 text-xs text-danger hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <textarea
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              rows={4}
              maxLength={200}
              className={`${inputBase} border-line resize-none`}
              placeholder="Provide a short bio... (optional)"
            />
            <p className="-mt-3 text-right text-xs text-subtle">{bio.length}/200</p>

            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="font-semibold text-2xl">{isSignup ? "Create an account" : "Welcome back"}</h2>
              <p className="text-sm text-muted mt-1">
                {isSignup ? "Sign up to start chatting" : "Log in to continue to QuickChat"}
              </p>
            </div>

            {isSignup && (
              <Field label="Full name" id="fullName" error={showError("fullName")}>
                <input
                  id="fullName"
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => {
                    setFullName((n) => formatName(n));
                    // Suggest a username from the name until the user types their own
                    if (!usernameEdited) setUsername(usernameFromName(fullName));
                    touch("fullName");
                  }}
                  value={fullName}
                  type="text"
                  maxLength={MAX_NAME_LENGTH}
                  autoComplete="name"
                  placeholder="John Doe"
                  aria-invalid={!!showError("fullName")}
                  className={`${inputBase} ${showError("fullName") ? "border-danger" : "border-line"}`}
                />
              </Field>
            )}

            {isSignup && (
              <Field
                label="Username"
                id="username"
                error={touched.username && !username ? errors.username : ""}
              >
                <UsernameInput
                  value={username}
                  onChange={(v) => {
                    setUsername(v);
                    setUsernameEdited(true);
                  }}
                  onBlur={() => touch("username")}
                  name={fullName}
                  showErrors={!!touched.username}
                  onStatusChange={setUsernameStatus}
                />
              </Field>
            )}

            <Field label={isSignup ? "Email" : "Email or username"} id="email" error={showError("email")}>
              <input
                id="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setServerEmailError("");
                }}
                onBlur={() => touch("email")}
                value={email}
                type={isSignup ? "email" : "text"}
                inputMode={isSignup ? "email" : "text"}
                autoComplete={isSignup ? "email" : "username"}
                autoCapitalize="none"
                spellCheck={false}
                placeholder={isSignup ? "you@example.com" : "you@example.com or your.username"}
                aria-invalid={!!showError("email")}
                className={`${inputBase} ${showError("email") ? "border-danger" : "border-line"}`}
              />
              {emailSuggestion && (
                <p className="text-xs text-muted">
                  Did you mean{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(emailSuggestion);
                      setServerEmailError("");
                    }}
                    className="text-accent-text font-medium underline cursor-pointer"
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
                          i <= Math.max(strength.score, 1) ? strengthColors[strength.score] : "bg-surface-3"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted w-14 text-right">{strength.label}</span>
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
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      touch("agreed");
                    }}
                    className="accent-[var(--accent)] w-4 h-4"
                  />
                  I agree to the terms of use & privacy policy.
                </label>
                {showError("agreed") && <p className="text-xs text-danger">{errors.agreed}</p>}
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

            <p className="text-sm text-muted text-center">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => switchTo(isSignup ? "Login" : "Sign up")}
                className="font-medium text-accent-text cursor-pointer hover:underline"
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
