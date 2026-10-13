
import { useState, useEffect } from "react";
import {
    ui,
    Alert,
    EmptyState,
    LoadingState,
    Modal,
    Spinner,
    formatDate
} from "./ui";
import { API_URL } from "../config";

const emptyInterview = {
    roundName: "Technical Round 1",
    scheduledDate: "",
    scheduledTime: "",
    mode: "Online",
    meetingLink: "",
    status: "Scheduled",
    outcome: "Pending",
    notes: "",
    feedback: ""
};

const toDateInput = (value) =>
    value ? String(value).slice(0, 10) : "";

const statusStyles = {
    Scheduled: "bg-blue-50 text-blue-700 ring-blue-600/20",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Cancelled: "bg-red-50 text-red-700 ring-red-600/20"
};

const outcomeStyles = {
    Pending: "bg-amber-50 text-amber-700",
    Passed: "bg-emerald-50 text-emerald-700",
    Failed: "bg-red-50 text-red-700",
    "On Hold": "bg-slate-100 text-slate-700"
};

function Badge({ value, styles }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                styles[value] || "bg-slate-100 text-slate-700"
            }`}
        >
            {value || "—"}
        </span>
    );
}

function Interviews() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [notice, setNotice] = useState(null);

    const [modal, setModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [interview, setInterview] = useState(emptyInterview);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // ---------------- FETCH INTERVIEWS ----------------

    const fetchInterviews = async () => {
        setLoading(true);
        setLoadError("");

        try {
            const response = await fetch(`${API_URL}/interviews`, {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("access_token")}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || data.msg ||
                    "Couldn't load interviews."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response from the server.");
            }

            setInterviews(data);
        } catch (error) {
            setLoadError(
                error.message ||
                "Couldn't load interviews. Check that Flask is running."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    // ---------------- EDIT INTERVIEW ----------------

    const openEdit = (item) => {
        setEditingId(item._id);

        setInterview({
            roundName: item.roundName || "",
            scheduledDate: toDateInput(item.scheduledDate),
            scheduledTime: item.scheduledTime || "",
            mode: item.mode || "Online",
            meetingLink: item.meetingLink || "",
            status: item.status || "Scheduled",
            outcome: item.outcome || "Pending",
            notes: item.notes || "",
            feedback: item.feedback || ""
        });

        setNotice(null);
        setModal(true);
    };

    const closeModal = () => {
        setModal(false);
        setEditingId(null);
        setInterview({ ...emptyInterview });
    };

    const handleChange = (e) => {
        setInterview(previous => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };

    // ---------------- UPDATE INTERVIEW ----------------

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingId) return;

        setSaving(true);
        setNotice(null);

        try {
            const response = await fetch(
                `${API_URL}/interviews/${editingId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            `Bearer ${localStorage.getItem("access_token")}`
                    },
                    body: JSON.stringify(interview)
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setNotice({
                    type: "error",
                    text: data.message || data.msg ||
                        "Couldn't update the interview."
                });
                return;
            }

            closeModal();
            setNotice({
                type: "success",
                text: "Interview updated successfully."
            });

            await fetchInterviews();
        } catch {
            setNotice({
                type: "error",
                text: "Couldn't connect to the server. Please try again."
            });
        } finally {
            setSaving(false);
        }
    };

    // ---------------- DELETE INTERVIEW ----------------

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this interview?"
        );

        if (!confirmed) return;

        setDeletingId(id);
        setNotice(null);

        try {
            const response = await fetch(
                `${API_URL}/interviews/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("access_token")}`
                    }
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setNotice({
                    type: "error",
                    text: data.message || data.msg ||
                        "Couldn't delete the interview."
                });
                return;
            }

            setInterviews(previous =>
                previous.filter(item => item._id !== id)
            );

            setNotice({
                type: "success",
                text: data.message || "Interview deleted successfully."
            });
        } catch {
            setNotice({
                type: "error",
                text: "Couldn't connect to the server."
            });
        } finally {
            setDeletingId(null);
        }
    };

    // ---------------- SUMMARY COUNTS ----------------

    const upcoming = interviews.filter(item =>
        item.status === "Scheduled" &&
        item.scheduledDate >= new Date().toLocaleDateString("en-CA")
    ).length;

    const completed = interviews.filter(
        item => item.status === "Completed"
    ).length;

    const passed = interviews.filter(
        item => item.outcome === "Passed"
    ).length;

    // Keep scheduled interviews first, then completed, with cancelled last.
    const statusOrder = {
        Scheduled: 0,
        Completed: 1,
        Cancelled: 2
    };
    const sortedInterviews = [...interviews].sort((a, b) => {
        const statusDifference =
            (statusOrder[a.status] ?? Number.MAX_SAFE_INTEGER) -
            (statusOrder[b.status] ?? Number.MAX_SAFE_INTEGER);
        if (statusDifference !== 0) return statusDifference;

        const dateA = `${a.scheduledDate || ""} ${a.scheduledTime || ""}`;
        const dateB = `${b.scheduledDate || ""} ${b.scheduledTime || ""}`;

        return dateA.localeCompare(dateB);
    });

    // ---------------- UI ----------------

    return (
        <div className={`${ui.page} min-h-[calc(100vh-4rem)]`}>

            {/* PAGE HEADER */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className={ui.pageTitle}>Interview Tracking</h1>
                    <p className={ui.pageSubtitle}>
                        Manage your interview rounds, schedules and outcomes.
                    </p>
                </div>

                <button
                    onClick={fetchInterviews}
                    disabled={loading}
                    className={ui.btnSecondary}
                >
                    {loading && <Spinner />}
                    Refresh interviews
                </button>
            </div>

            {/* NOTIFICATIONS */}
            {notice && (
                <div className="mt-5">
                    <Alert
                        type={notice.type}
                        onDismiss={() => setNotice(null)}
                    >
                        {notice.text}
                    </Alert>
                </div>
            )}

            {loadError && (
                <div className="mt-5">
                    <Alert type="error">{loadError}</Alert>
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={`${ui.card} p-5`}>
                    <p className="text-sm font-medium text-slate-500">
                        Upcoming interviews
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-blue-700">
                        {upcoming}
                    </p>
                </div>

                <div className={`${ui.card} p-5`}>
                    <p className="text-sm font-medium text-slate-500">
                        Completed interviews
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-700">
                        {completed}
                    </p>
                </div>

                <div className={`${ui.card} p-5`}>
                    <p className="text-sm font-medium text-slate-500">
                        Passed rounds
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-teal-700">
                        {passed}
                    </p>
                </div>
            </div>

            {/* INTERVIEW LIST */}
            <div className="mt-7">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        All interviews
                    </h2>
                    <span className="text-sm text-slate-500">
                        {interviews.length}{" "}
                        {interviews.length === 1 ? "interview" : "interviews"}
                    </span>
                </div>

                {loading ? (
                    <LoadingState label="Loading interviews..." />
                ) : loadError ? (
                    <EmptyState
                        title="Unable to load interviews"
                        description="Check your connection and try refreshing the page."
                        action={
                            <button
                                onClick={fetchInterviews}
                                className={ui.btnPrimary}
                            >
                                Try again
                            </button>
                        }
                    />
                ) : sortedInterviews.length === 0 ? (
                    <EmptyState
                        title="No interviews scheduled yet"
                        description="Open Applications and click Add interview on an application to schedule your first round."
                    />
                ) : (
                    <div className="grid gap-4">
                        {sortedInterviews.map(item => (
                            <div
                                key={item._id}
                                className={`${ui.card} p-5 transition hover:shadow-md`}
                            >
                                {/* COMPANY AND ROUND */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {item.companyName || "Unknown company"}
                                        </h3>
                                        <p className="mt-0.5 text-sm text-slate-500">
                                            {item.jobRole || "Role not specified"}
                                        </p>
                                        <p className="mt-3 font-medium text-teal-800">
                                            {item.roundName}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            value={item.status}
                                            styles={statusStyles}
                                        />
                                        <Badge
                                            value={item.outcome}
                                            styles={outcomeStyles}
                                        />
                                    </div>
                                </div>

                                {/* INTERVIEW DETAILS */}
                                <div className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <p className="text-slate-500">
                                            Interview date
                                        </p>
                                        <p className="mt-1 font-medium text-slate-900">
                                            {formatDate(item.scheduledDate)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500">
                                            Interview time
                                        </p>
                                        <p className="mt-1 font-medium text-slate-900">
                                            {item.scheduledTime || "Not specified"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500">
                                            Interview mode
                                        </p>
                                        <p className="mt-1 font-medium text-slate-900">
                                            {item.mode || "Not specified"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500">
                                            Outcome
                                        </p>
                                        <p className="mt-1 font-medium text-slate-900">
                                            {item.outcome || "Pending"}
                                        </p>
                                    </div>
                                </div>

                                {/* MEETING LINK */}
                                {item.meetingLink && (
                                    <div className="mt-4">
                                        <a
                                            href={item.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-sm text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                                        >
                                            Join interview ↗
                                        </a>
                                    </div>
                                )}

                                {/* NOTES */}
                                {item.notes && (
                                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Preparation notes
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                            {item.notes}
                                        </p>
                                    </div>
                                )}

                                {item.feedback && (
                                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Feedback
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                            {item.feedback}
                                        </p>
                                    </div>
                                )}

                                {/* ACTIONS */}
                                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className={ui.btnSecondary}
                                    >
                                        Edit interview
                                    </button>

                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        disabled={deletingId === item._id}
                                        className={ui.btnDanger}
                                    >
                                        {deletingId === item._id && <Spinner />}
                                        {deletingId === item._id
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* EDIT INTERVIEW MODAL */}
            {modal && (
                <Modal
                    title="Edit interview"
                    onClose={closeModal}
                >
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                        {notice?.type === "error" && (
                            <div className="sm:col-span-2">
                                <Alert type="error">
                                    {notice.text}
                                </Alert>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <label htmlFor="editRoundName" className={ui.label}>
                                Interview round *
                            </label>
                            <input
                                id="editRoundName"
                                name="roundName"
                                value={interview.roundName}
                                onChange={handleChange}
                                className={ui.input}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="editScheduledDate" className={ui.label}>
                                Interview date *
                            </label>
                            <input
                                id="editScheduledDate"
                                name="scheduledDate"
                                type="date"
                                value={interview.scheduledDate}
                                onChange={handleChange}
                                className={ui.input}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="editScheduledTime" className={ui.label}>
                                Interview time
                            </label>
                            <input
                                id="editScheduledTime"
                                name="scheduledTime"
                                type="time"
                                value={interview.scheduledTime}
                                onChange={handleChange}
                                className={ui.input}
                            />
                        </div>

                        <div>
                            <label htmlFor="editMode" className={ui.label}>
                                Interview mode
                            </label>
                            <select
                                id="editMode"
                                name="mode"
                                value={interview.mode}
                                onChange={handleChange}
                                className={ui.input}
                            >
                                <option value="Online">Online</option>
                                <option value="In-person">In-person</option>
                                <option value="Phone">Phone</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="editMeetingLink" className={ui.label}>
                                Meeting link
                            </label>
                            <input
                                id="editMeetingLink"
                                name="meetingLink"
                                type="url"
                                placeholder="https://"
                                value={interview.meetingLink}
                                onChange={handleChange}
                                className={ui.input}
                            />
                        </div>

                        <div>
                            <label htmlFor="editStatus" className={ui.label}>
                                Status
                            </label>
                            <select
                                id="editStatus"
                                name="status"
                                value={interview.status}
                                onChange={handleChange}
                                className={ui.input}
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="editOutcome" className={ui.label}>
                                Outcome
                            </label>
                            <select
                                id="editOutcome"
                                name="outcome"
                                value={interview.outcome}
                                onChange={handleChange}
                                disabled={interview.status !== "Completed"}
                                className={`${ui.input} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                            {interview.status !== "Completed" && (
                                <p className="mt-1 text-xs text-slate-500">
                                    Complete the interview to record an outcome.
                                </p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="editNotes" className={ui.label}>
                                Preparation notes
                            </label>
                            <textarea
                                id="editNotes"
                                name="notes"
                                rows={3}
                                value={interview.notes}
                                onChange={handleChange}
                                className={ui.input}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="editFeedback" className={ui.label}>
                                Feedback
                            </label>
                            <textarea
                                id="editFeedback"
                                name="feedback"
                                rows={3}
                                value={interview.feedback}
                                onChange={handleChange}
                                className={ui.input}
                            />
                        </div>

                        <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className={ui.btnSecondary}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className={ui.btnPrimary}
                            >
                                {saving && <Spinner />}
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default Interviews;
