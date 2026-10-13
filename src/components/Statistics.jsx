import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { API_URL } from "../config";
import { LoadingState, ui } from "./ui";

const STATUS_COLORS = {
  Applied: "#3b82f6",
  "Online Test": "#8b5cf6",
  Interview: "#f59e0b",
  Rejected: "#ef4444",
  Selected: "#10b981",
};

const STATUSES = [
  "Applied",
  "Online Test",
  "Interview",
  "Rejected",
  "Selected",
];

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function StatCard({ title, value, description }) {
  return (
    <div className={`${ui.card} p-5`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>

      <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className={`${ui.card} min-w-0 p-5 sm:p-6`}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-5 min-w-0">{children}</div>
    </div>
  );
}

export default function Statistics() {
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Please log in to view your statistics.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [applicationsResponse, interviewsResponse] =
          await Promise.all([
            fetch(`${API_URL}/applications`, { headers }),
            fetch(`${API_URL}/interviews`, { headers }),
          ]);

        if (
          applicationsResponse.status === 401 ||
          interviewsResponse.status === 401
        ) {
          localStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }

        if (!applicationsResponse.ok || !interviewsResponse.ok) {
          throw new Error("Unable to load statistics. Please try again.");
        }

        const applicationsData = await applicationsResponse.json();
        const interviewsData = await interviewsResponse.json();

        setApplications(
          Array.isArray(applicationsData) ? applicationsData : []
        );

        setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // 1. Count applications by status.
  const statusData = STATUSES.map((status, index) => ({
    name: status,
    value: applications.filter((app) => app.status === status).length,
    color: STATUS_COLORS[status] || COLORS[index],
  }));

  const applicationsWithStatus = statusData.filter(
    (item) => item.value > 0
  );

  // 2. Count applications submitted in each of the last six months.
  const now = new Date();

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    );

    const month = date.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const count = applications.filter((app) => {
      const applicationDate = parseDate(app.applicationDate);

      return (
        applicationDate &&
        applicationDate.getMonth() === date.getMonth() &&
        applicationDate.getFullYear() === date.getFullYear()
      );
    }).length;

    return { month, applications: count };
  });

  // 3. Calculate placement progress.
  const totalApplications = applications.length;

  const interviewStageApplications = applications.filter(
    (app) => app.status === "Interview"
  ).length;

  const selectedApplications = applications.filter(
    (app) => app.status === "Selected"
  ).length;

  const rejectedApplications = applications.filter(
    (app) => app.status === "Rejected"
  ).length;

  const interviewRate =
    totalApplications > 0
      ? Math.round((interviewStageApplications / totalApplications) * 100)
      : 0;

  const selectionRate =
    totalApplications > 0
      ? Math.round((selectedApplications / totalApplications) * 100)
      : 0;

  // 4. Count actual interview outcomes.
  const outcomeData = [
    {
      name: "Passed",
      value: interviews.filter((item) => item.outcome === "Passed").length,
      color: "#10b981",
    },
    {
      name: "Failed",
      value: interviews.filter((item) => item.outcome === "Failed").length,
      color: "#ef4444",
    },
    {
      name: "On Hold",
      value: interviews.filter((item) => item.outcome === "On Hold").length,
      color: "#f59e0b",
    },
    {
      name: "Pending",
      value: interviews.filter(
        (item) =>
          !item.outcome ||
          item.outcome === "Pending"
      ).length,
      color: "#64748b",
    },
  ];

  if (loading) {
    return <LoadingState label="Loading your statistics…" />;
  }

  if (error) {
    return (
      <div className={`${ui.page} pt-6`}>
       <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Could not load statistics
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={`${ui.btnPrimary} mt-4 !bg-red-700 hover:!bg-red-800 focus-visible:!ring-red-600`}
        >
          Try Again
        </button>
       </div>
      </div>
    );
  }

  return (
    <div className={`${ui.page} space-y-8`}>
      {/* Page heading */}
      <div>
        <h1 className={ui.pageTitle}>
          Statistics & Analytics
        </h1>
        <p className="mt-2 text-slate-500">
          Understand your placement progress and application activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Applications"
          value={totalApplications}
          description="Applications submitted"
        />

        <StatCard
          title="Interview Stage"
          value={interviewStageApplications}
          description={`${interviewRate}% of your applications`}
        />

        <StatCard
          title="Selected"
          value={selectedApplications}
          description={`${selectionRate}% selection rate`}
        />

        <StatCard
          title="Rejected"
          value={rejectedApplications}
          description="Applications not progressing"
        />
      </div>

      {/* Application status and monthly activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Application Status Breakdown"
          subtitle="How your applications are distributed by status"
        >
          {applicationsWithStatus.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-center text-slate-500">
              No applications yet. Add applications to see your chart.
            </div>
          ) : (
            <>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={applicationsWithStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {applicationsWithStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
                {applicationsWithStatus.map((item) => {
                  const percentage = Math.round(
                    (item.value / totalApplications) * 100
                  );

                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600">
                        {item.name} {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard
          title="Monthly Application Activity"
          subtitle="Applications submitted during the last six months"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="applications"
                name="Applications"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Placement progress and interview outcomes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Placement Progress"
          subtitle="Your application pipeline at a glance"
        >
          <div className="space-y-5 py-2">
            {statusData.map((item) => {
              const percentage =
                totalApplications > 0
                  ? (item.value / totalApplications) * 100
                  : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.name}
                    </span>
                    <span className="text-slate-500">
                      {item.value} ({Math.round(percentage)}%)
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard
          title="Interview Outcomes"
          subtitle="Results recorded for your interviews"
        >
          {interviews.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-center text-slate-500">
              No interviews recorded yet. Add interviews to see your results.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={outcomeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Interviews" radius={[6, 6, 0, 0]}>
                  {outcomeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Helpful note */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">
          Keep tracking your progress!
        </h3>
        <p className="mt-1 text-sm text-blue-800">
          These statistics update when you open the page and fetch your latest
          application and interview records.
        </p>
      </div>
    </div>
  );
}