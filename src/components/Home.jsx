import { Link } from "react-router-dom";
import { ui, StatusBadge } from "./ui";

// Large CTA buttons (same colors as ui.btnPrimary / ui.btnSecondary, bigger padding)
const ctaPrimary =
    "inline-flex items-center justify-center rounded-lg bg-teal-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2";
const ctaSecondary =
    "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2";

const icon = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
};

const FEATURES = [
    {
        title: "Track Applications",
        text: "Keep all your job applications organized in one place.",
        icon: (
            <svg {...icon}>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
        ),
    },
    {
        title: "Manage Resumes",
        text: "Keep track of the resumes you use for different opportunities.",
        icon: (
            <svg {...icon}>
                <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
                <path d="M14 3v5h5M9 13h6M9 17h4" />
            </svg>
        ),
    },
    {
        title: "Track Interviews",
        text: "Stay on top of upcoming interviews and assessments.",
        icon: (
            <svg {...icon}>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
        ),
    },
    {
        title: "Monitor Progress",
        text: "Get a clear view of your placement journey.",
        icon: (
            <svg {...icon}>
                <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
            </svg>
        ),
    },
];

// Decorative sample rows for the product preview
const PREVIEW = [
    { company: "Deolite", role: "Frontend", status: "Interview" },
    { company: "Tcs", role: "Aptitude round", status: "Online Test" },
    { company: "Acme Corp", role: "Backend Developer", status: "Applied" },
];

function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            {/* Navbar */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                            P
                        </span>
                        <span className="text-base font-semibold tracking-tight sm:text-lg">
                            Placement Tracker
                        </span>
                    </Link>
                    <nav className="flex items-center gap-2" aria-label="Account">
                        <Link
                            to="/login"
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:px-4"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className={`${ui.btnPrimary} !px-3 sm:!px-4`}
                        >
                            Register
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="px-4 pb-12 pt-14 sm:px-6 sm:pt-20 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            Stay Organized. Stay Placement Ready.
                        </h1>
                        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            Track your job applications, resumes, interviews, and
                            placement journey — all in one place.
                        </p>
                        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                            <Link to="/login" className={ctaSecondary}>
                                Login
                            </Link>
                            <Link to="/register" className={ctaPrimary}>
                                Get Started
                            </Link>
                        </div>
                    </div>

                    {/* Product preview (decorative) */}
                    <div
                        className="mx-auto mt-14 max-w-2xl"
                        aria-hidden="true"
                    >
                        <div className={`${ui.card} overflow-hidden`}>
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
                                <span className="text-sm font-semibold text-slate-900">
                                    Your Applications
                                </span>
                                <span className="text-xs text-slate-500">
                                    3 tracked
                                </span>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {PREVIEW.map((row) => (
                                    <li
                                        key={row.company}
                                        className="flex items-center justify-between gap-4 px-5 py-3.5"
                                    >
                                        <div className="min-w-0 text-left">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {row.company}
                                            </p>
                                            <p className="truncate text-sm text-slate-500">
                                                {row.role}
                                            </p>
                                        </div>
                                        <StatusBadge status={row.status} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                            Everything your placement search needs
                        </h2>
                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {FEATURES.map((f) => (
                                <div
                                    key={f.title}
                                    className={`${ui.card} p-6 transition hover:border-teal-200 hover:shadow-md`}
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                        {f.icon}
                                    </span>
                                    <h3 className="mt-4 text-base font-semibold text-slate-900">
                                        {f.title}
                                    </h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                                        {f.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl rounded-2xl bg-teal-700 px-6 py-12 text-center sm:px-12">
                        <h2 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            Ready to take control of your placement journey?
                        </h2>
                        <Link
                            to="/register"
                            className="mt-7 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700"
                        >
                            Create your account
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                © 2026 Placement Tracker
            </footer>
        </div>
    );
}

export default Home;
