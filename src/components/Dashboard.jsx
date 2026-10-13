import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ui, StatusBadge } from "./ui";
import { API_URL } from "../config";

function parseDate(value) {
    if (!value) return null;

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoMatch) {
        return new Date(
            Number(isoMatch[1]),
            Number(isoMatch[2]) - 1,
            Number(isoMatch[3])
        );
    }

    const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (slashMatch) {
        return new Date(
            Number(slashMatch[3]),
            Number(slashMatch[2]) - 1,
            Number(slashMatch[1])
        );
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
    const date = parseDate(value);
    if (!date) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getDayDifference(value) {
    const date = parseDate(value);
    if (!date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function EmptyRow({ columns, message }) {
    return (
        <tr>
            <td colSpan={columns} className="px-4 py-8 text-center text-sm text-slate-500">
                {message}
            </td>
        </tr>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadDashboard() {
            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    navigate("/");
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };
                const urls = [
                    `${API_URL}/jobs`,
                    `${API_URL}/applications`,
                    `${API_URL}/interviews`,
                ];

                const responses = await Promise.all(
                    urls.map((url) => fetch(url, { headers, signal: controller.signal }))
                );

                if (responses.some((response) => response.status === 401)) {
                    localStorage.removeItem("access_token");
                    navigate("/");
                    return;
                }

                if (responses.some((response) => !response.ok)) {
                    throw new Error("Couldn't load dashboard data. Please try again.");
                }

                const [jobsData, applicationsData, interviewsData] = await Promise.all(
                    responses.map((response) => response.json())
                );

                if (
                    !Array.isArray(jobsData) ||
                    !Array.isArray(applicationsData) ||
                    !Array.isArray(interviewsData)
                ) {
                    throw new Error("The server returned an unexpected response.");
                }

                setJobs(jobsData);
                setApplications(applicationsData);
                setInterviews(interviewsData);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message || "Couldn't load dashboard data.");
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        loadDashboard();
        return () => controller.abort();
    }, [navigate]);

    const upcomingInterviews = interviews.filter((interview) => {
        const days = getDayDifference(interview.scheduledDate);
        return interview.status === "Scheduled" && days !== null && days >= 0;
    });

    const selectedApplications = applications.filter(
        (application) => application.status === "Selected"
    );

    // Combine saved-job application deadlines with assessment dates.
    const deadlines = [
        ...jobs
            .filter((job) => {
                const days = getDayDifference(job.deadline);
                return days !== null && days >= 0;
            })
            .map((job) => ({
                id: `job-${job._id}`,
                companyName: job.companyName,
                jobRole: job.jobRole,
                deadline: job.deadline,
                type: "Application deadline",
            })),
        ...applications
            .filter((application) => {
                const days = getDayDifference(application.assessmentDate);
                return (
                    days !== null &&
                    days >= 0 &&
                    application.status !== "Rejected" &&
                    application.status !== "Selected"
                );
            })
            .map((application) => ({
                id: `assessment-${application._id}`,
                companyName: application.companyName,
                jobRole: application.jobRole,
                deadline: application.assessmentDate,
                type: "Assessment",
            })),
    ].sort((a, b) => getDayDifference(a.deadline) - getDayDifference(b.deadline));

    const upcomingAssessments = applications
        .filter((application) => {
            const days = getDayDifference(application.assessmentDate);
            return (
                days !== null &&
                days >= 0 &&
                application.status !== "Rejected" &&
                application.status !== "Selected"
            );
        })
        .map((application) => ({
            id: `assessment-${application._id}`,
            companyName: application.companyName,
            type: "Assessment",
            date: application.assessmentDate,
            time: "",
        }));

    const upcomingInterviewRows = upcomingInterviews.map((interview) => ({
        id: `interview-${interview._id}`,
        companyName: interview.companyName,
        type: interview.roundName || "Interview",
        date: interview.scheduledDate,
        time: interview.scheduledTime || "",
    }));

    const upcomingEvents = [...upcomingAssessments, ...upcomingInterviewRows]
        .sort((a, b) => {
            const difference = getDayDifference(a.date) - getDayDifference(b.date);
            return difference || (a.time || "").localeCompare(b.time || "");
        })
        .slice(0, 5);

    const recentApplications = [...applications]
        .sort((a, b) => {
            const dateA = parseDate(a.applicationDate)?.getTime() || 0;
            const dateB = parseDate(b.applicationDate)?.getTime() || 0;
            return dateB - dateA;
        })
        .slice(0, 5);

    const stats = [
        { label: "To Apply", value: jobs.length, accent: "border-t-slate-400", path: "/jobs" },
        { label: "Applied", value: applications.length, accent: "border-t-sky-500", path: "/applications" },
        { label: "Interviews", value: upcomingInterviews.length, accent: "border-t-violet-500", path: "/interviews" },
        { label: "Offers", value: selectedApplications.length, accent: "border-t-emerald-500", path: "/applications" },
    ];

    const th = "px-4 py-3 text-left text-xs font-semibold text-slate-500";
    const td = "px-4 py-3 text-sm text-slate-700";

    return (
        <div className={`${ui.page} min-h-[calc(100vh-4rem)] space-y-6`}>
            <div>
                <h1 className={ui.pageTitle}>Good Morning!</h1>
                <p className={ui.pageSubtitle}>Here's your placement progress</p>
            </div>

            {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((stat) => (
                    <button
                        key={stat.label}
                        type="button"
                        onClick={() => navigate(stat.path)}
                        disabled={loading}
                        className={`${ui.card} border-t-4 ${stat.accent} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-wait`}
                    >
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                            {loading ? "—" : stat.value}
                        </p>
                    </button>
                ))}
            </div>

            <section className={ui.card}>
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">Deadlines</h2>
                    <p className="mt-1 text-sm text-slate-500">Application deadlines and upcoming assessments</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className={th}>Company / Type</th>
                                <th className={th}>Role</th>
                                <th className={th}>Deadline</th>
                                <th className={th}>Days Remain</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <EmptyRow columns={4} message="Loading deadlines…" />
                            ) : deadlines.length === 0 ? (
                                <EmptyRow columns={4} message="No upcoming deadlines. Add a deadline to a saved job or assessment." />
                            ) : deadlines.slice(0, 5).map((item) => {
                                const days = getDayDifference(item.deadline);
                                return (
                                    <tr key={item.id} className="transition hover:bg-slate-50">
                                        <td className={`${td} font-medium text-slate-900`}>
                                            {item.companyName}
                                            <span className="block text-xs font-normal text-slate-500">{item.type}</span>
                                        </td>
                                        <td className={td}>{item.jobRole}</td>
                                        <td className={td}>{formatDate(item.deadline)}</td>
                                        <td className={td}>
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                days === 0 ? "bg-red-50 text-red-700" :
                                                days <= 3 ? "bg-amber-50 text-amber-700" :
                                                "bg-sky-50 text-sky-700"
                                            }`}>
                                                {days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"}`}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
                <section className={ui.card}>
                    <div className="border-b border-slate-200 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">Upcoming Assessments & Interviews</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className={th}>Company</th>
                                    <th className={th}>Type</th>
                                    <th className={th}>Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <EmptyRow columns={3} message="Loading events…" />
                                ) : upcomingEvents.length === 0 ? (
                                    <EmptyRow columns={3} message="No upcoming assessments or interviews." />
                                ) : upcomingEvents.map((event) => (
                                    <tr key={event.id} className="transition hover:bg-slate-50">
                                        <td className={`${td} font-medium text-slate-900`}>{event.companyName}</td>
                                        <td className={td}>
                                            {event.type}
                                            {event.time && <span className="block text-xs text-slate-500">{event.time}</span>}
                                        </td>
                                        <td className={td}>{formatDate(event.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className={ui.card}>
                    <div className="border-b border-slate-200 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-900">Recent Applications</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className={th}>Company</th>
                                    <th className={th}>Role</th>
                                    <th className={th}>Status</th>
                                    <th className={th}>Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <EmptyRow columns={4} message="Loading applications…" />
                                ) : recentApplications.length === 0 ? (
                                    <EmptyRow columns={4} message="No applications yet. Add your first application!" />
                                ) : recentApplications.map((application) => (
                                    <tr key={application._id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => navigate("/applications")}>
                                        <td className={`${td} font-medium text-slate-900`}>{application.companyName}</td>
                                        <td className={td}>{application.jobRole}</td>
                                        <td className={td}><StatusBadge status={application.status} /></td>
                                        <td className={td}>{formatDate(application.applicationDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
