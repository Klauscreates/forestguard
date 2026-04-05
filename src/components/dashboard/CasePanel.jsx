import { AlertTriangle, ExternalLink, FileText, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getRiskTone(risk = 0) {
  if (risk >= 90) return "bg-destructive/15 text-destructive";
  if (risk >= 70) return "bg-orange-500/15 text-orange-200";
  if (risk >= 40) return "bg-amber-500/15 text-amber-200";
  return "bg-blue-500/15 text-blue-200";
}

function getAgentTone(caseInsight) {
  if (!caseInsight) return "bg-white/10 text-slate-200";
  if (caseInsight.mode === "gemini" && caseInsight.ok) return "bg-emerald-400/15 text-emerald-100";
  if (caseInsight.mode === "unavailable") return "bg-amber-400/15 text-amber-100";
  return "bg-red-400/15 text-red-100";
}

function statusLabel(upload) {
  if (upload.status === "pending") return "Pending";
  if (upload.status === "analyzing") return "Analyzing";
  if (upload.status === "complete") return "Complete";
  return "Failed";
}

export default function CasePanel({
  alert,
  caseInsight,
  isReasoning,
  onGenerateReport,
  attachments = [],
  mode,
}) {
  if (!alert) {
    return (
      <Card className="flex min-h-0 flex-col rounded-[26px] border border-white/10 bg-[#091424] text-white">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Case Context</p>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-slate-400">
          Select an alert to open a live case, review agent reasoning, and generate a report.
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#091424] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-200" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Selected Case</p>
            <p className="truncate text-[11px] text-slate-400">{alert.zone}</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100"
          onClick={onGenerateReport}
        >
          Generate Report <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="rounded-[22px] border border-cyan-300/15 bg-cyan-300/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge className={cn("border-0 text-[10px]", getRiskTone(alert.risk))}>{alert.eventType}</Badge>
                <Badge
                  className={cn(
                    "border-0 text-[10px]",
                    mode === "live" ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100"
                  )}
                >
                  {mode === "live" ? "Live case" : "Fallback case"}
                </Badge>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-tight text-white">{alert.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                {alert.coords} · {alert.source}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#08111f] px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Risk</p>
              <p className="text-3xl font-bold text-white">{alert.risk}</p>
              <p className="text-[11px] text-slate-400">/ 100</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Area affected</p>
              <p className="mt-1 text-sm font-semibold text-white">{alert.hectares} ha</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Trend</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">{alert.trend}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">7-day signals</p>
              <p className="mt-1 text-sm font-semibold text-white">{alert.signalCount7d}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">30-day signals</p>
              <p className="mt-1 text-sm font-semibold text-white">{alert.signalCount30d}</p>
            </div>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/8 p-3 md:col-span-2 xl:col-span-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100">Estimated carbon impact</p>
              {alert.carbonTracked && alert.estimatedCarbonTonnes ? (
                <>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(alert.estimatedCarbonTonnes)} tCO2e at risk
                  </p>
                  <p className="mt-2 text-xs leading-5 text-emerald-50">
                    Conservative forest-loss carbon estimate tied to this case. Methodology coverage only applies to forest-loss alerts with affected-hectare data.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-5 text-emerald-50">
                  Carbon estimate is not shown for this case because the current alert class is outside the active carbon methodology coverage.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <section className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Business impact</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">{alert.businessImpact}</p>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <p>
                  <span className="font-semibold text-white">Why this case matters:</span> {alert.why}
                </p>
                <p>
                  <span className="font-semibold text-white">Land-use context:</span> {alert.landUseContext}
                </p>
                <p>
                  <span className="font-semibold text-white">Next review step:</span> {alert.nextReviewStep}
                </p>
              </div>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Agent reasoning</p>
                  <p className="mt-1 text-[11px] text-slate-400">Live Gemini analysis is only shown for the selected case.</p>
                </div>
                <Badge className={cn("border-0 text-[10px]", getAgentTone(caseInsight))}>
                  {caseInsight?.mode === "gemini"
                    ? "Gemini live"
                    : caseInsight?.mode === "unavailable"
                      ? "Gemini unavailable"
                      : caseInsight?.mode === "error"
                        ? "Agent error"
                        : "Awaiting run"}
                </Badge>
              </div>

              {isReasoning ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running live case reasoning for the selected alert...
                </div>
              ) : caseInsight ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm font-semibold text-white">{caseInsight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {caseInsight.summary || caseInsight.message || "No live agent summary is available."}
                    </p>
                  </div>

                  {caseInsight.sections?.length > 0 && (
                    <div className="grid gap-3 xl:grid-cols-3">
                      {caseInsight.sections.map((section) => (
                        <div key={section.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">{section.label}</p>
                          <p className="mt-2 text-xs leading-5 text-slate-300">{section.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {caseInsight.recommendedActions?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Live recommended actions</p>
                      {caseInsight.recommendedActions.map((action) => (
                        <div key={action} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200">
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-xs text-slate-400">No live reasoning run has completed for this case yet.</div>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-200" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workflow actions</p>
              </div>
              <div className="mt-4 space-y-2">
                {alert.recommendedActions?.map((action) => (
                  <div key={action} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200">
                    {action}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-200" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Uploaded evidence</p>
              </div>

              {attachments.length ? (
                <div className="mt-4 space-y-2">
                  {attachments.map((upload) => (
                    <div key={upload.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">{upload.fileName}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {upload.analysis?.title || upload.message || "Uploaded file linked to this case."}
                          </p>
                        </div>
                        <Badge className="border-0 bg-white/10 text-[10px] text-white">{statusLabel(upload)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-400">No uploaded logs or files have been analyzed for this case yet.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </Card>
  );
}
