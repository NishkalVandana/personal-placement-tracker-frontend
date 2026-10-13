import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ui, Alert, Spinner } from "./ui";
import { API_URL } from "../config";
function Login() {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit=async (e)=>{
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response=await fetch(`${API_URL}/login`,{
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body:JSON.stringify({
                  email:mail,
                  password:password
              })
          })
      const msg=await response.json()
      console.log(msg)
      if (response.ok){
          localStorage.setItem("access_token", msg.access_token);
          navigate("/dashboard");
      } else {
          setError(msg.msg || msg.message || msg.error || "Login failed. Check your email and password and try again.");
      }
    } catch (err) {
      setError("Can't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
    }
  return (
    <>
      <div
        id="login"
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
        <form onSubmit={handleSubmit} className={`${ui.card} w-full max-w-md space-y-5 p-6 sm:p-8`}>
          <div>
            <h2 className={ui.pageTitle}>Log in</h2>
            <p className="mt-1 text-sm text-slate-500">Welcome back. Pick up where you left off.</p>
          </div>

          <Alert type="error">{error}</Alert>

          <div>
            <label htmlFor="email" className={ui.label}>Email</label>
            <input
              id="email"
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              className={ui.input}
              placeholder="you@example.com"
              name="email"
              autoComplete="email"
              required
            ></input>
          </div>
          <div>
            <label htmlFor="password" className={ui.label}>Password</label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className={ui.input}
              placeholder="Enter your password"
              name="password"
              autoComplete="current-password"
              required
            ></input>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`${ui.btnPrimary} w-full`}
          >
            {loading && <Spinner />}
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </>
  );
}
export default Login;
