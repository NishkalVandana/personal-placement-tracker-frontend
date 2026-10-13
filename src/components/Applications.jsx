
import { useState, useEffect } from "react";
import {
    ui,
    StatusBadge,
    Alert,
    EmptyState,
    LoadingState,
    Modal,
    Spinner,
    formatDate
} from "./ui";
import { API_URL } from "../config";

const emptyApplication = {
    companyName: "",
    jobRole: "",
    applicationDate: "",
    status: "",
    assessmentDate: "",
    jobLink: "",
    resume: "",
    note: ""
};

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

function Applications() {
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [notice, setNotice] = useState(null);
    const [saving, setSaving] = useState(false);

    const [resumes, setResumes] = useState([]);
    const [applications, setApplications] = useState([]);

    // Application modal state
    const [modal, setModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [application, setApplication] = useState(emptyApplication);

    // Interview modal state
    const [interviewModal, setInterviewModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [interview, setInterview] = useState(emptyInterview);
    const [interviewSaving, setInterviewSaving] = useState(false);
    const [interviewNotice, setInterviewNotice] = useState(null);

    // Load resumes and applications
    useEffect(() => {
        let active = true;

        const loadData = async () => {
            setLoading(true);
            setLoadError("");

            const token = localStorage.getItem("access_token");
            const headers = {
                Authorization: `Bearer ${token}`
            };

            try {
                const [resumeResponse, applicationResponse] =
                    await Promise.all([
                        fetch(`${API_URL}/resumes`, { headers }),
                        fetch(`${API_URL}/applications`, { headers })
                    ]);

                if (!resumeResponse.ok || !applicationResponse.ok) {
                    throw new Error("Unable to load your data.");
                }

                const resumeData = await resumeResponse.json();
                const applicationData = await applicationResponse.json();

                if (!Array.isArray(resumeData) ||
                    !Array.isArray(applicationData)) {
                    throw new Error("Unexpected response from the server.");
                }

                if (active) {
                    setResumes(resumeData);
                    setApplications(applicationData);
                }
            } catch {
                if (active) {
                    setLoadError(
                        "Couldn't load your applications or resumes. " +
                        "Check that the server is running and try again."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, [refresh]);

    // ---------------- APPLICATION HANDLERS ----------------

    const handleChange = (e) => {
        setApplication({
            ...application,
            [e.target.name]: e.target.value
        });
    };

    const openAdd = () => {
        setEditingId(null);
        setApplication({ ...emptyApplication });
        setNotice(null);
        setModal(true);
    };

    const openEdit = (app) => {
        setEditingId(app._id);

        setApplication({
            companyName: app.companyName || "",
            jobRole: app.jobRole || "",
            applicationDate: toDateInput(app.applicationDate),
            status: app.status || "",
            assessmentDate: toDateInput(app.assessmentDate),
            jobLink: app.jobLink || "",
            resume: app.resume_id || app.resume || "",
            note: app.note || ""
        });

        setNotice(null);
        setModal(true);
    };

    const closeModal = () => {
        setModal(false);
        setEditingId(null);
        setApplication({ ...emptyApplication });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setNotice(null);

        const isEdit = editingId !== null;
        const existingApplication = isEdit
            ? applications.find(app => app._id === editingId)
            : null;
        const shouldScheduleInterview =
            application.status === "Interview" &&
            (!isEdit || existingApplication?.status !== "Interview");

        try {
            const response = await fetch(
                isEdit
                    ? `${API_URL}/applications/${editingId}`
                    : `${API_URL}/applications`,
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization:
                            `Bearer ${localStorage.getItem("access_token")}`
                    },
                    body: JSON.stringify(application)
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setNotice({
                    type: "error",
                    text: data.msg || data.message ||
                        data.error || "Couldn't save the application."
                });
                return;
            }

            const savedApplication = {
                ...application,
                _id: isEdit ? editingId : data.application_id,
                resume_id: application.resume
            };

            if (shouldScheduleInterview && !savedApplication._id) {
                closeModal();
                setRefresh(current => !current);
                setNotice({
                    type: "error",
                    text:
                        "Application was saved, but its ID was not returned. " +
                        "Please refresh and add the interview from the application list."
                });
                return;
            }

            closeModal();
            setRefresh(current => !current);

            if (shouldScheduleInterview) {
                openInterviewModal(savedApplication);
            } else {
                setNotice({
                    type: "success",
                    text: isEdit
                        ? "Application updated successfully."
                        : "Application added successfully."
                });
            }
        } catch {
            setNotice({
                type: "error",
                text: "Couldn't connect to the server. Please try again."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(
                `${API_URL}/applications/${id}`,
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
                    text: data.message || "Couldn't delete the application."
                });
                return;
            }

            setApplications(previous =>
                previous.filter(app => app._id !== id)
            );

            setNotice({
                type: "success",
                text: data.message || "Application deleted successfully."
            });
        } catch {
            setNotice({
                type: "error",
                text: "Couldn't connect to the server."
            });
        }
    };

    // ---------------- INTERVIEW HANDLERS ----------------

    const openInterviewModal = (app) => {
        setSelectedApplication(app);
        setInterview({ ...emptyInterview });
        setInterviewNotice(null);
        setInterviewModal(true);
    };

    const closeInterviewModal = () => {
        setInterviewModal(false);
        setSelectedApplication(null);
        setInterview({ ...emptyInterview });
        setInterviewNotice(null);
    };

    const handleInterviewChange = (e) => {
        setInterview(previous => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };

    const handleInterviewSubmit = async (e) => {
        e.preventDefault();

        if (!selectedApplication) return;

        setInterviewSaving(true);
        setInterviewNotice(null);

        try {
            const response = await fetch(`${API_URL}/interviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        `Bearer ${localStorage.getItem("access_token")}`
                },
                body: JSON.stringify({
                    application_id: selectedApplication._id,
                    ...interview
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setInterviewNotice({
                    type: "error",
                    text: data.message || data.msg ||
                        "Couldn't schedule the interview."
                });
                return;
            }

            // Show success outside the modal so it remains visible.
            closeInterviewModal();

            setNotice({
                type: "success",
                text: `Interview scheduled successfully for ${
                    selectedApplication.companyName
                }.`
            });
        } catch {
            setInterviewNotice({
                type: "error",
                text: "Couldn't connect to the server. Please try again."
            });
        } finally {
            setInterviewSaving(false);
        }
    };

    // ---------------- DISPLAY HELPERS ----------------

    const statusOrder = {
        Selected: 0,
        Rejected: 1,
        Interview: 2,
        "Online Test": 3,
        Applied: 4
    };
    const list = Array.isArray(applications)
        ? applications
            .map((app, index) => ({ app, index }))
            .sort((a, b) =>
                (statusOrder[a.app.status] ?? Number.MAX_SAFE_INTEGER) -
                    (statusOrder[b.app.status] ?? Number.MAX_SAFE_INTEGER) ||
                a.index - b.index
            )
            .map(({ app }) => app)
        : [];
    const resumeList = Array.isArray(resumes) ? resumes : [];

    const resumeLabel = (app) => {
        const id = app.resume_id || app.resume;
        const match = resumeList.find(resume => resume._id === id);

        return match ? match.resumeName : id || "—";
    };

    const isEdit = editingId !== null;

    return (
        <div className={`${ui.page} min-h-[calc(100vh-4rem)]`}>

            {/* Page heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className={ui.pageTitle}>Your Applications</h1>
                    <p className={ui.pageSubtitle}>
                        {list.length}{" "}
                        {list.length === 1 ? "application" : "applications"} tracked
                    </p>
                </div>

                <button onClick={openAdd} className={ui.btnPrimary}>
                    + Add application
                </button>
            </div>

            {/* Notifications */}
            <div className="mt-6 space-y-4">
                {notice && (
                    <Alert
                        type={notice.type}
                        onDismiss={() => setNotice(null)}
                    >
                        {notice.text}
                    </Alert>
                )}

                {loadError && (
                    <Alert type="error">{loadError}</Alert>
                )}
            </div>

            {/* ADD / EDIT APPLICATION MODAL */}
            {modal && (
                <Modal
                    title={isEdit ? "Edit application" : "Add application"}
                    onClose={closeModal}
                >
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2"
                    >
                        {notice?.type === "error" && (
                            <div className="sm:col-span-2">
                                <Alert
                                    type="error"
                                    onDismiss={() => setNotice(null)}
                                >
                                    {notice.text}
                                </Alert>
                            </div>
                        )}

                        <div>
                            <label htmlFor="companyName" className={ui.label}>
                                Company name *
                            </label>
                            <input
                                id="companyName"
                                name="companyName"
                                value={application.companyName}
                                onChange={handleChange}
                                className={ui.input}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="jobRole" className={ui.label}>
                                Job role *
                            </label>
                            <input
                                id="jobRole"
                                name="jobRole"
                                value={application.jobRole}
                                onChange={handleChange}
                                className={ui.input}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="applicationDate" className={ui.label}>
                                Application date *
                            </label>
                            <input
                                id="applicationDate"
                                name="applicationDate"
                                value={application.applicationDate}
                                onChange={handleChange}
                                type="date"
                                className={ui.input}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className={ui.label}>
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={application.status}
                                onChange={handleChange}
                                className={ui.input}
                            >
                                <option value="">Select status</option>
                                <option value="Applied">Applied</option>
                                <option value="Online Test">Online Test</option>
                                <option value="Interview">Interview</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Selected">Selected</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="assessmentDate" className={ui.label}>
                                Assessment date
                            </label>
                            <input
                                id="assessmentDate"
                                name="assessmentDate"
                                value={application.assessmentDate}
                                onChange={handleChange}
                                type="date"
                                className={ui.input}
                            />
                        </div>

                        <div>
                            <label htmlFor="resume" className={ui.label}>
                                Resume *
                            </label>
                            <select
                                id="resume"
                                name="resume"
                                value={application.resume}
                                onChange={handleChange}
                                className={ui.input}
                                required
                            >
                                <option value="">Select resume</option>
                                {resumeList.map(resume => (
                                    <option key={resume._id} value={resume._id}>
                                        {resume.resumeName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="jobLink" className={ui.label}>
                                Job link *
                            </label>
                            <input
                                id="jobLink"
                                name="jobLink"
                                value={application.jobLink}
                                onChange={handleChange}
                                type="url"
                                placeholder="https://"
                                className={ui.input}
                                required
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="note" className={ui.label}>
                                Note
                            </label>
                            <textarea
                                id="note"
                                name="note"
                                rows={3}
                                value={application.note}
                                onChange={handleChange}
                                className={ui.input}
                            />
                        </div>

                        <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
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
                                {saving
                                    ? "Saving..."
                                    : isEdit
                                        ? "Save changes"
                                        : "Save application"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ADD INTERVIEW MODAL */}
            {interviewModal && selectedApplication && (
                <Modal
                    title="Schedule an interview"
                    onClose={closeInterviewModal}
                >
                    <div className="mb-5 rounded-lg bg-teal-50 p-4">
                        <p className="font-semibold text-teal-900">
                            {selectedApplication.companyName}
                        </p>
                        <p className="text-sm text-teal-800">
                            {selectedApplication.jobRole}
                        </p>
                    </div>

                    <form
                        onSubmit={handleInterviewSubmit}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                        {interviewNotice && (
                            <div className="sm:col-span-2">
                                <Alert
                                    type={interviewNotice.type}
                                    onDismiss={() => setInterviewNotice(null)}
                                >
                                    {interviewNotice.text}
                                </Alert>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <label htmlFor="roundName" className={ui.label}>
                                Interview round *
                            </label>
                            <select
                                id="roundName"
                                name="roundName"
                                value={interview.roundName}
                                onChange={handleInterviewChange}
                                className={ui.input}
                                required
                            >
                                <option value="Online Assessment">Online Assessment</option>
                                <option value="Technical Round 1">Technical Round 1</option>
                                <option value="Technical Round 2">Technical Round 2</option>
                                <option value="HR Round">HR Round</option>
                                <option value="Managerial Round">Managerial Round</option>
                                <option value="Final Round">Final Round</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="scheduledDate" className={ui.label}>
                                Interview date *
                            </label>
                            <input
                                id="scheduledDate"
                                name="scheduledDate"
                                type="date"
                                value={interview.scheduledDate}
                                onChange={handleInterviewChange}
                                className={ui.input}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="scheduledTime" className={ui.label}>
                                Interview time
                            </label>
                            <input
                                id="scheduledTime"
                                name="scheduledTime"
                                type="time"
                                value={interview.scheduledTime}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            />
                        </div>

                        <div>
                            <label htmlFor="mode" className={ui.label}>
                                Interview mode
                            </label>
                            <select
                                id="mode"
                                name="mode"
                                value={interview.mode}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            >
                                <option value="Online">Online</option>
                                <option value="In-person">In-person</option>
                                <option value="Phone">Phone</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="meetingLink" className={ui.label}>
                                Meeting link
                            </label>
                            <input
                                id="meetingLink"
                                name="meetingLink"
                                type="url"
                                placeholder="https://"
                                value={interview.meetingLink}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            />
                        </div>

                        <div>
                            <label htmlFor="interviewStatus" className={ui.label}>
                                Status
                            </label>
                            <select
                                id="interviewStatus"
                                name="status"
                                value={interview.status}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            >
                                <option value="Scheduled">Scheduled</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="outcome" className={ui.label}>
                                Outcome
                            </label>
                            <select
                                id="outcome"
                                name="outcome"
                                value={interview.outcome}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            >
                                <option value="Pending">Pending</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="interviewNotes" className={ui.label}>
                                Preparation notes
                            </label>
                            <textarea
                                id="interviewNotes"
                                name="notes"
                                rows={3}
                                placeholder="Topics to revise, documents to prepare..."
                                value={interview.notes}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="feedback" className={ui.label}>
                                Feedback
                            </label>
                            <textarea
                                id="feedback"
                                name="feedback"
                                rows={2}
                                placeholder="Record feedback after the interview"
                                value={interview.feedback}
                                onChange={handleInterviewChange}
                                className={ui.input}
                            />
                        </div>

                        <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeInterviewModal}
                                className={ui.btnSecondary}
                                disabled={interviewSaving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={interviewSaving}
                                className={ui.btnPrimary}
                            >
                                {interviewSaving && <Spinner />}
                                {interviewSaving
                                    ? "Scheduling..."
                                    : "Schedule interview"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* APPLICATION LIST */}
            <div className="mt-6">
                {loading ? (
                    <LoadingState label="Loading applications..." />
                ) : list.length === 0 ? (
                    <EmptyState
                        title="No applications yet"
                        description="Add your first application to start tracking statuses, assessment dates and the resume you used."
                        action={
                            <button
                                onClick={openAdd}
                                className={ui.btnPrimary}
                            >
                                + Add application
                            </button>
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {list.map(app => (
                            <div
                                key={app._id}
                                className={`${ui.card} p-5 transition hover:shadow-md`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-lg font-semibold text-slate-900">
                                            {app.companyName}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {app.jobRole}
                                        </p>
                                    </div>

                                    <StatusBadge status={app.status} />
                                </div>

                                <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                                    <div>
                                        <dt className="text-slate-500">
                                            Application date
                                        </dt>
                                        <dd className="mt-0.5 font-medium text-slate-900">
                                            {formatDate(app.applicationDate)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-slate-500">
                                            Assessment date
                                        </dt>
                                        <dd className="mt-0.5 font-medium text-slate-900">
                                            {formatDate(app.assessmentDate)}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-slate-500">Resume</dt>
                                        <dd className="mt-0.5 truncate font-medium text-slate-900">
                                            {resumeLabel(app)}
                                        </dd>
                                    </div>
                                </dl>

                                {app.note && (
                                    <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                        {app.note}
                                    </p>
                                )}

                                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                    {app.jobLink ? (
                                        <a
                                            href={app.jobLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-teal-700 transition hover:text-teal-900 hover:underline"
                                        >
                                            View job posting
                                        </a>
                                    ) : (
                                        <span />
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => openInterviewModal(app)}
                                            disabled={
                                                app.status === "Selected" ||
                                                app.status === "Rejected"
                                            }
                                            className={`${ui.btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
                                        >
                                            + Add interview
                                        </button>

                                        <button
                                            onClick={() => openEdit(app)}
                                            className={ui.btnSecondary}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(app._id)}
                                            className={ui.btnDanger}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Applications;
