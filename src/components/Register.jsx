
import React, { useState } from "react";
import { ui, Alert, Spinner } from "./ui";
import { API_URL } from "../config";

function Register() {
  const [username, setUsername] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState("register");
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Register and request an OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email: mail.trim().toLowerCase(),
            password,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMail(mail.trim().toLowerCase());
        setStep("verify");
        setNotice({
          type: "success",
          text: result.message || "OTP sent! Check your inbox.",
        });
      } else {
        setNotice({
          type: "error",
          text: result.message || "Registration failed.",
        });
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: "Can't reach the server. Check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setNotice(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: mail,
            otp,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setStep("verified");
        setNotice({
          type: "success",
          text:
            result.message ||
            "Email verified successfully! You can now log in.",
        });
      } else {
        setNotice({
          type: "error",
          text: result.message || "OTP verification failed.",
        });
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: "Can't reach the server. Please try again.",
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
        onSubmit={
          step === "register"
            ? handleSubmit
            : step === "verify"
            ? handleVerify
            : (e) => e.preventDefault()
        }
        className={`${ui.card} w-full max-w-md space-y-5 p-6 sm:p-8`}
      >
        <div>
          <h2 className={ui.pageTitle}>
            {step === "register"
              ? "Create your account"
              : step === "verify"
              ? "Verify your email"
              : "Email verified!"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {step === "register"
              ? "Track applications, resumes and interviews in one place."
              : step === "verify"
              ? `Enter the six-digit code sent to ${mail}.`
              : "Your account is ready. You can now log in."}
          </p>
        </div>

        {notice && (
          <Alert
            type={notice.type}
            onDismiss={() => setNotice(null)}
          >
            {notice.text}
          </Alert>
        )}

        {step === "register" && (
          <>
            <div>
              <label htmlFor="username" className={ui.label}>
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={ui.input}
                placeholder="Choose a username"
                autoComplete="username"
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
                value={mail}
                onChange={(e) => setMail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                className={ui.input}
                placeholder="Create a password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${ui.btnPrimary} w-full`}
            >
              {loading && <Spinner />}
              {loading ? "Sending OTP…" : "Create account"}
            </button>
          </>
        )}

        {step === "verify" && (
          <>
            <div>
              <label htmlFor="otp" className={ui.label}>
                Six-digit OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`${ui.input} text-center text-xl tracking-[0.4em]`}
                placeholder="000000"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`${ui.btnPrimary} w-full`}
            >
              {loading && <Spinner />}
              {loading ? "Verifying…" : "Verify email"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep("register");
                setOtp("");
                setNotice(null);
              }}
              className="w-full text-sm text-slate-600 hover:text-teal-700"
            >
              Back to registration
            </button>
          </>
        )}

        {step === "verified" && (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className={`${ui.btnPrimary} w-full`}
          >
            Go to login
          </button>
        )}
      </form>
    </div>
  );
}

export default Register;
