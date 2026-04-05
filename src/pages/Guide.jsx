import { ArrowRight, CheckCircle2, FileWarning, Orbit, Radar, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { guideSteps } from "@/data/builders";

const guideSignals = [
  "Forest-loss spike near monitored sourcing region",
  "Protected-area overlap that increases compliance exposure",
  "Traceability gap that turns environmental uncertainty into procurement risk",
];

const outputStack = [
  "Hotspot map with a selected alert path",
  "Zone risk score and rationale",
  "Action recommendations for procurement and compliance",
  "Report scaffold for the due-diligence packet",
];

export default function Guide() {
  return (
    <div className="min-h-screen bg-[#081120] px-6 py-10 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Operator Guide</p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em]">How ForestGuard runs as an operating system.</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              This guide turns the hackathon concept into a repeatable workflow. The app only works if each stage produces clean handoffs from data to decision to proof.
            </p>
          </div>
          <Link to="/builders">
            <Button className="bg-white text-slate-950 hover:bg-slate-100">
              Open Builders <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Four-Step Flow</p>
            <div className="mt-6 grid gap-4">
              {guideSteps.map((item) => (
                <div key={item.step} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                      {item.step}
                    </div>
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">{item.title}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5">
            <Card className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 text-white">
              <div className="flex items-center gap-3">
                <Radar className="h-6 w-6 text-cyan-200" />
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">MVP input signals</h2>
              </div>
              <div className="mt-5 space-y-3">
                {guideSignals.map((signal) => (
                  <div key={signal} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <p className="text-sm leading-6 text-slate-300">{signal}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 text-white">
              <div className="flex items-center gap-3">
                <Orbit className="h-6 w-6 text-cyan-200" />
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">Required outputs</h2>
              </div>
              <div className="mt-5 space-y-3">
                {outputStack.map((item) => (
                  <div key={item} className="flex gap-3">
                    <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px] border border-amber-400/20 bg-amber-400/5 p-7 text-white">
              <div className="flex items-center gap-3">
                <FileWarning className="h-6 w-6 text-amber-200" />
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">What not to do</h2>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                <p>Do not present ForestGuard as a generic climate dashboard. The value is decision support, not satellite novelty.</p>
                <p>Do not spread the MVP across too many regions or commodities. Keep the demo narrow and convincing.</p>
                <p>Do not rely on live AI calls for the core demo path until the static recommendation flow is stable.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
