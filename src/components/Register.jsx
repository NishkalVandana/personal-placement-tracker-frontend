import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ui, Alert, Spinner } from "./ui";
import { API_URL } from "../config";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        navigate("/login", {
          state: {
            registrationSuccess:
              result.message || "Registration successful. You can now log in.",
          },
        });
      } else {
        setNotice({
          type: "error",
          text: result.message || "Registration failed.",
        });
      }
    } catch {
      setNotice({
        type: "error",
        text: "Can't reach the server. Check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="register"
      className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10"
    >
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white shadow-sm shadow-teal-900/15">
          P
        </span>
        <span className="text-xl font-semibold tracking-tight text-slate-900">
          Placement Tracker
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`${ui.card} w-full max-w-md space-y-5 p-6 sm:p-8`}
      >
        <div>
          <h2 className={ui.pageTitle}>Create your account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track applications, resumes and interviews in one place.
          </p>
        </div>

        {notice && (
          <Alert type={notice.type} onDismiss={() => setNotice(null)}>
            {notice.text}
          </Alert>
        )}

        <div>
          <label htmlFor="username" className={ui.label}>
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={ui.input}
            placeholder="Choose a username"
            autoComplete="username"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className={ui.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={ui.input}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={ui.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={ui.input}
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${ui.btnPrimary} w-full`}
        >
          {loading && <Spinner />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}

export default Register;
