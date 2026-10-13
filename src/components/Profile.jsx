import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { Alert, LoadingState, ui, Spinner } from "./ui";

const initialProfile = {
  username: "",
  email: "",
  mobile: "",
  notifications: { email: true, sms: false, whatsapp: false },
  reminders: { deadlines: true, assessments: true, interviews: true }
};

function getErrorMessage(data, fallback) {
  const message = data?.message || data?.msg || data?.error;
  return typeof message === "string" ? message : fallback;
}

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          window.location.href = "/login";
          return;
        }
        const response = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
          return;
        }
        if (!response.ok) throw new Error(getErrorMessage(data, "Unable to load profile."));
        setProfile({
          ...initialProfile,
          ...data,
          notifications: {
            ...initialProfile.notifications,
            ...data.notifications,
            sms: false,
            whatsapp: false
          },
          reminders: { ...initialProfile.reminders, ...data.reminders }
        });
      } catch (error) {
        setNotice({ type: "error", text: error.message || "Unable to load profile." });
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((previous) => ({ ...previous, [name]: value }));
  };

  const handleToggle = (section, name, checked) => {
    setProfile((previous) => ({
      ...previous,
      [section]: { ...previous[section], [name]: checked }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        ...profile,
        notifications: {
          ...profile.notifications,
          sms: false,
          whatsapp: false
        }
      };
      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(data, "Unable to save profile."));
      setNotice({ type: "success", text: "Profile saved successfully." });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Unable to save profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading profile…" />;

  const toggleClass = "h-4 w-4 accent-teal-700";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className={ui.pageTitle}>My Profile</h1>
        <p className={ui.pageSubtitle}>Manage your contact details and placement reminders.</p>
      </div>
      {notice && (
        <Alert type={notice.type}>{notice.text}</Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={`${ui.card} p-5 sm:p-6`}>
          <h2 className="text-lg font-semibold text-slate-900">Contact information</h2>
          <p className="mt-1 text-sm text-slate-500">Keep your contact details up to date.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profileUsername" className={ui.label}>Full name</label>
              <input id="profileUsername" name="username" value={profile.username} onChange={handleChange} required maxLength={100} className={ui.input} />
            </div>
            <div>
              <label htmlFor="profileEmail" className={ui.label}>Email address</label>
              <input id="profileEmail" type="email" value={profile.email} readOnly className={ui.input} />
              <p className="mt-1 text-xs text-slate-500">Email changes are not enabled here.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="profileMobile" className={ui.label}>Mobile number with country code</label>
              <input id="profileMobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 9876543210" value={profile.mobile} onChange={handleChange} maxLength={20} className={ui.input} />
              <p className="mt-1 text-xs text-slate-500">Your mobile number is stored as contact information.</p>
            </div>
          </div>
        </section>
        <section className={`${ui.card} p-5 sm:p-6`}>
          <h2 className="text-lg font-semibold text-slate-900">Notification channels</h2>
          <p className="mt-1 text-sm text-slate-500">Choose where you would like to receive reminders.</p>
          <div className="mt-5 space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className={`${toggleClass} mt-1`} checked={Boolean(profile.notifications.email)} onChange={(event) => handleToggle("notifications", "email", event.target.checked)} />
              <span>
                <span className="block text-sm font-medium text-slate-800">Email notifications</span>
                <span className="mt-0.5 block text-sm text-slate-500">Send reminders to your registered email.</span>
              </span>
            </label>
          </div>
        </section>
        <section className={`${ui.card} p-5 sm:p-6`}>
          <h2 className="text-lg font-semibold text-slate-900">Reminder types</h2>
          <p className="mt-1 text-sm text-slate-500">Choose which placement events matter to you.</p>
          <div className="mt-5 space-y-4">
            {[
              { key: "deadlines", title: "Job application deadlines" },
              { key: "assessments", title: "Online assessments" },
              { key: "interviews", title: "Upcoming interviews" }
            ].map((item) => (
              <label key={item.key} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" className={toggleClass} checked={Boolean(profile.reminders[item.key])} onChange={(event) => handleToggle("reminders", item.key, event.target.checked)} />
                <span className="text-sm font-medium text-slate-800">{item.title}</span>
              </label>
            ))}
          </div>
        </section>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving && <Spinner />}
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}