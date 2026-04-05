import { ArrowRight, CheckCircle2, Clock3, Cpu, Layers3, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { builders, executionPhases } from "@/data/builders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusTone = {
  Ready: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20",
  "In Progress": "bg-amber-400/10 text-amber-100 border-amber-300/20",
};

export default function Builders() {
  return (
    <div className="min-h-screen bg-[#081120] px-6 py-10 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Builders</p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em]">The modules we need to ship this prototype.</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
              This page turns the concept into working lanes. Each builder has a scoped outcome, concrete deliverables, and a status so the team can move without ambiguity.
            </p>
          </div>
          <Link to="/dashboard">
            <Button className="bg-white text-slate-950 hover:bg-slate-100">
              Back to Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="grid gap-5">
            {builders.map((builder) => (
              <Card key={builder.id} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-cyan-200" />
                      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">{builder.name}</h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{builder.owner}</p>
                  </div>
                  <Badge className={`border ${statusTone[builder.status] || statusTone.Ready}`}>{builder.status}</Badge>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">{builder.outcome}</p>

                <div className="mt-6 grid gap-3">
                  {builder.deliverables.map((deliverable) => (
                    <div key={deliverable} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-6 text-slate-300">{deliverable}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-5">
            <Card className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 text-white">
              <div className="flex items-center gap-3">
                <Layers3 className="h-6 w-6 text-cyan-200" />
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">Execution cadence</h2>
              </div>
              <div className="mt-6 space-y-4">
                {executionPhases.map((phase) => (
                  <div key={phase.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-xl font-semibold tracking-[-0.03em]">{phase.objective}</h3>
                      <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">
                        {phase.window}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      {phase.tasks.map((task) => (
                        <div key={task} className="flex gap-3">
                          <Clock3 className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                          <p className="text-sm leading-6 text-slate-300">{task}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[28px] border border-red-300/15 bg-red-400/5 p-7 text-white">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-red-200" />
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">Demo hardening checklist</h2>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                <p>Every visible interaction should resolve from local state so the demo survives flaky auth or model connectivity.</p>
                <p>Keep the challenge card, dashboard, guide, and builders visually consistent so the story feels like one intentional product.</p>
                <p>Finish with the report modal and risk workflow because judges remember operational credibility more than raw feature count.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
