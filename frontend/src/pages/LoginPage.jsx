import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const inputClass =
  "p-2 bg-transparent border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";
const buttonClass =
  "py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const isSignup = currState === "Sign up";

  const switchTo = (state) => {
    setCurrState(state);
    setIsDataSubmitted(false);
    setPassword("");
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Sign up has two steps: details first, then bio
    if (isSignup && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    setSubmitting(true);
    const credentials = isSignup ? { fullName, email, password, bio } : { email, password };
    await login(isSignup ? "signup" : "login", credentials);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl p-4">
      <img src={assets.logo_big} alt="QuickChat" className="w-[min(30vw,250px)]" />

      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-5 rounded-lg shadow-lg w-[min(90vw,400px)]"
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
              className={inputClass}
              placeholder="Provide a short bio..."
              required
              autoFocus
            />
            <p className="-mt-3 text-right text-xs text-gray-400">{bio.length}/200</p>

            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </>
        ) : (
          <>
            <h2 className="font-medium text-2xl">{currState}</h2>

            {isSignup && (
              <input
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
                type="text"
                maxLength={50}
                autoComplete="name"
                className={inputClass}
                placeholder="Full Name"
                required
              />
            )}

            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              autoComplete="email"
              placeholder="Email Address"
              required
              className={inputClass}
            />

            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "Password (min. 6 characters)" : "Password"}
              minLength={isSignup ? 6 : undefined}
              required
              className={inputClass}
            />

            <button type="submit" disabled={submitting} className={buttonClass}>
              {isSignup ? "Next" : submitting ? "Logging in…" : "Login Now"}
            </button>

            {isSignup && (
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" required />
                Agree to the terms of use & privacy policy.
              </label>
            )}

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
