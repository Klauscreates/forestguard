import { useLocation } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#081120] p-6 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="space-y-2">
          <h1 className="font-display text-7xl font-semibold tracking-[-0.05em] text-slate-300">404</h1>
          <div className="mx-auto h-px w-16 bg-white/15" />
        </div>

        <div className="mt-6 space-y-3">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-white">Page Not Found</h2>
          <p className="leading-relaxed text-slate-400">
            The page <span className="font-semibold text-slate-200">"{pageName}"</span> is not part of the current ForestGuard demo flow.
          </p>
        </div>

        <div className="pt-6">
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
