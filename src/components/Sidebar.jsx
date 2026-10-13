import { useNavigate, useLocation } from "react-router-dom"

// Items without a `path` are not wired to a route yet, so they stay inactive (same as before).
const NAV_ITEMS = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Jobs to Apply", path: "/jobs" },
    { label: "Applications", path: "/applications" },
    { label: "Email summary" },
    { label: "Interviews",path:"/interviews" },
    { label: "Resumes", path: "/resumes" },
    { label: "Statistics",path:"/statistics" },
]

function Sidebar({ open = false, onClose = () => {} }) {
    const navigate = useNavigate()
    const location = useLocation()

    const go = (path) => {
        navigate(path)
        onClose()
    }

    return (
        <>
            {open && (
                <button
                    type="button"
                    className="fixed inset-0 z-20 cursor-default bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                />
            )}
            <aside
                id="primary-navigation"
                className={`fixed inset-y-0 left-0 z-20 w-72 transform border-r border-slate-200 bg-white pt-16 shadow-xl shadow-slate-900/5 transition-transform duration-200 lg:sticky lg:bottom-auto lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0 lg:translate-x-0 lg:self-start lg:pt-0 lg:shadow-none ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <nav className="flex flex-col gap-1 p-4" aria-label="Main navigation">
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Workspace</p>
                    {NAV_ITEMS.map((item) => {
                        const active = item.path && location.pathname === item.path
                        const base =
                            "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"

                        if (!item.path) {
                            return (
                                <div
                                    key={item.label}
                                    aria-disabled="true"
                                    className={`${base} cursor-not-allowed text-slate-400`}
                                >
                                    {item.label}
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                        Soon
                                    </span>
                                </div>
                            )
                        }

                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => go(item.path)}
                                aria-current={active ? "page" : undefined}
                                className={`${base} ${
                                    active
                                        ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-700/10"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                {item.label}
                            </button>
                        )
                    })}
                </nav>
            </aside>
        </>
    )
}
export default Sidebar
