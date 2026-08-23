import { useState } from "react";

function AuthPage({ onSelect }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? `${API_URL}/auth/login`
          : `${API_URL}/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Something went wrong."
        );
      }

      // Backend gives us the real student_id.
      // Frontend uses username for display.
      onSelect({
        id: data.student_id,
        username: data.username,
        name: data.username,
        avatar: data.username
          .charAt(0)
          .toUpperCase(),
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="student-selection">
      <div className="student-selection-content">

        <p className="eyebrow">
          LEARNLENS • PERSONALIZED LEARNING
        </p>

        <h1>
          Learn what you need.
          <br />
          <span>Prove what you know.</span>
        </h1>

        <p className="student-selection-description">
          Your learning path adapts to what you
          actually understand.
        </p>

        <div className="auth-card">

          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode === "login"
                  ? "auth-tab active"
                  : "auth-tab"
              }
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode === "register"
                  ? "auth-tab active"
                  : "auth-tab"
              }
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Create account
            </button>
          </div>

          <h2>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <form onSubmit={handleSubmit}>

            <label>
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
            />

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
            />

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Login →"
                  : "Create account →"}
            </button>

          </form>

          <p className="auth-switch">
            {mode === "login"
              ? "New to LearnLens?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                );
                setError("");
              }}
            >
              {mode === "login"
                ? " Create one"
                : " Login"}
            </button>
          </p>

        </div>

      </div>
    </main>
  );
}

export default AuthPage;