import { ArrowRight, BadgeAlert, Leaf, ShieldCheck, TreePine } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { forestGuardBusinessContext } from "../data/business-context";

const productProof = [
  {
    icon: Leaf,
    title: "Live carbon at risk",
    description: "Estimate tCO2e exposure from live forest-loss alerts instead of waiting for annual reporting.",
  },
  {
    icon: BadgeAlert,
    title: "Procurement action",
    description: "Turn environmental change into review, evidence, and escalation decisions for sourcing teams.",
  },
  {
    icon: ShieldCheck,
    title: "Defensible workflow",
    description: "Show what is live, what is under review, and what evidence supports the case before action is taken.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.78),_transparent_30%),radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_24%),linear-gradient(160deg,_#112b63_0%,_#0b1731_45%,_#07111f_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:56px_56px]" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
              <TreePine className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">ForestGuard</p>
              <p className="text-xs text-slate-300">Carbon impact command center</p>
            </div>
          </div>

          <Link to="/dashboard">
            <Button className="bg-white text-slate-950 hover:bg-slate-100">
              Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </header>

        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 pb-8 lg:px-10 lg:pb-10">
          <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <Card className="overflow-hidden rounded-[30px] border border-white/20 bg-[#0d1734]/78 p-7 shadow-2xl shadow-blue-950/40 backdrop-blur lg:p-10">
              <Badge className="w-fit border-0 bg-white/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-slate-200">
                ForestGuard Carbon Command
              </Badge>
              <h1 className="mt-6 font-display text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl xl:text-7xl">
                Track carbon-at-risk from live sourcing alerts.
              </h1>
              <p className="mt-5 max-w-4xl text-xl leading-8 text-slate-200 sm:text-2xl">
                ForestGuard turns public disturbance signals into a procurement and compliance command layer that shows where carbon exposure is emerging and which cases are under active review.
              </p>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
                {forestGuardBusinessContext.problemStatement} Instead of stopping at a map, ForestGuard estimates carbon exposure for live forest-loss cases in São Félix do Xingu and pushes those cases into operator workflows, evidence review, and due-diligence reporting.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100">
                    Launch Command Center <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                  Live DETER alerts + carbon estimates + case review workflow
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {productProof.map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="rounded-[30px] border border-emerald-300/18 bg-emerald-300/8 p-6 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-100">Why this matters</p>
                <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-white">
                  Move from reporting carbon to preventing it.
                </p>
                <div className="mt-5 space-y-3 text-sm leading-7 text-emerald-50">
                  <p>Live public alert signals become case-specific carbon exposure estimates.</p>
                  <p>Operators can show which exposure is actively under review instead of claiming vague sustainability progress.</p>
                  <p>The dashboard is built for procurement, compliance, and sustainability teams, not researchers.</p>
                </div>
              </Card>

              <Card className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200">Product focus</p>
                <div className="mt-5 space-y-4">
                  {[
                    "One focused cattle geography: São Félix do Xingu",
                    "Real live public disturbance alerts",
                    "Carbon-at-risk methodology with visible guardrails",
                    "Agent-led case review, uploads, and reporting",
                  ].map((line) => (
                    <div key={line} className="rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 text-sm text-slate-300">
                      {line}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
