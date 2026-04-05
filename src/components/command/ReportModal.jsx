import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, MapPin, Printer, Shield } from "lucide-react";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";

function formatTimestamp(value) {
  if (!value) return "Awaiting refresh";
  return new Date(value).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function getRiskMeta(alert) {
  if (!alert) return { label: "Unavailable", tone: "bg-white/10 text-slate-200" };
  if (alert.risk >= 90) return { label: "Critical", tone: "bg-destructive/10 text-destructive" };
  if (alert.risk >= 70) return { label: "High", tone: "bg-orange-500/10 text-orange-600" };
  if (alert.risk >= 40) return { label: "Medium", tone: "bg-amber-500/10 text-amber-600" };
  return { label: "Low", tone: "bg-blue-500/10 text-blue-600" };
}

function buildReportLines({ alert, mode, generatedAt, sources, caseInsight, attachments }) {
  if (!alert) {
    return ["No case selected."];
  }

  const lines = [
    `ForestGuard Due Diligence Report`,
    ``,
    `Alert: ${alert.title}`,
    `Zone: ${alert.zone}`,
    `Coordinates: ${alert.coords}`,
    `Risk: ${alert.risk}/100`,
    `Estimated carbon at risk: ${alert.estimatedCarbonTonnes ? `${alert.estimatedCarbonTonnes} tCO2e` : "Methodology unavailable for this alert class"}`,
    `Mode: ${mode === "live" ? "LIVE PUBLIC DATA" : mode === "loading" ? "LOADING LIVE DATA" : "FALLBACK DEMO DATA"}`,
    `Generated at: ${formatTimestamp(generatedAt)}`,
    `Sources: ${(sources && sources.length ? sources : [alert.source]).join(", ")}`,
    ``,
    `Business impact`,
    alert.businessImpact,
    ...(alert.supplyChainLinkSummary ? ["", "Documented buyer links", alert.supplyChainLinkSummary] : []),
    ...((alert.historicalBuyerLinks || []).flatMap((link) => [
      `${link.propertyName} · ${link.owner}`,
      `Historical buyer link: ${link.linkedBuyers.join(", ")}`,
      `Evidence summary: ${link.evidenceSummary}`,
      `Confidence: ${link.confidenceLabel} · ${link.matchingPrecision}`,
      `Source: ${link.sourceTitle} (${link.sourcePublishedAt})`,
      `URL: ${link.sourceUrl}`,
    ])),
    ``,
    `Evidence and context`,
    `Why it matters: ${alert.why}`,
    `Threat profile: ${alert.threat}`,
    `Land-use context: ${alert.landUseContext}`,
    `Carbon methodology: ${alert.carbonMethodology || "Unavailable"}`,
    ...((alert.evidence || []).map((entry) => `Evidence: ${entry}`)),
    ``,
    `Recommended actions`,
    ...((alert.recommendedActions || [alert.action]).map((entry, index) => `${index + 1}. ${entry}`)),
    ``,
    `Next review step`,
    alert.nextReviewStep,
  ];

  if (caseInsight) {
    lines.push("", "Agent reasoning", `${caseInsight.title || "Case reasoning"}`);
    if (caseInsight.summary || caseInsight.message) {
      lines.push(caseInsight.summary || caseInsight.message);
    }
    if (caseInsight.sections?.length) {
      caseInsight.sections.forEach((section) => {
        lines.push(`${section.label}: ${section.text}`);
      });
    }
  }

  if (attachments?.length) {
    lines.push("", "Uploaded evidence analyses");
    attachments.forEach((attachment) => {
      lines.push(
        `${attachment.fileName}: ${attachment.analysis?.summary || attachment.message || attachment.status}`
      );
    });
  }

  return lines;
}

function downloadReportPdf({ alert, mode, generatedAt, sources, caseInsight, attachments }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const lineHeight = 16;
  let cursorY = 54;

  const lines = buildReportLines({ alert, mode, generatedAt, sources, caseInsight, attachments });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ForestGuard Case Report", marginX, cursorY);
  cursorY += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  lines.forEach((line) => {
    const chunks = doc.splitTextToSize(line || " ", 520);
    chunks.forEach((chunk) => {
      if (cursorY > pageHeight - 54) {
        doc.addPage();
        cursorY = 54;
      }
      doc.text(chunk, marginX, cursorY);
      cursorY += lineHeight;
    });
  });

  const slug = alert?.id || "forestguard-report";
  doc.save(`${slug}.pdf`);
}

function printReport({ alert, mode, generatedAt, sources, caseInsight, attachments }) {
  const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!reportWindow) return;

  const lines = buildReportLines({ alert, mode, generatedAt, sources, caseInsight, attachments });
  const body = lines
    .map((line) => (line ? `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "<br />"))
    .join("");

  reportWindow.document.write(`
    <html>
      <head>
        <title>ForestGuard Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px; color: #111827; line-height: 1.5; }
          h1 { margin-top: 0; }
          p { margin: 0 0 10px; }
        </style>
      </head>
      <body>
        <h1>ForestGuard Case Report</h1>
        ${body}
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

export default function ReportModal({
  open,
  onClose,
  alert,
  mode,
  generatedAt,
  sources = [],
  caseInsight,
  attachments = [],
}) {
  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const riskMeta = getRiskMeta(alert);
  const recommendedActions = alert ? alert.recommendedActions || [alert.action] : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {alert ? `${alert.title} Report` : "ForestGuard Due Diligence Report"}
          </DialogTitle>
          <DialogDescription>
            {alert
              ? "Live case report generated from the selected alert, current evidence chain, and available agent reasoning."
              : "Select an alert to generate a live case report."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Zone</p>
              <p className="font-semibold text-foreground">{alert ? alert.zone : "No alert selected"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Primary Action</p>
              <p className="font-semibold text-foreground">{alert ? alert.action : "Select a case first"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk Classification</p>
              <Badge className={cn("mt-0.5 border-0", riskMeta.tone)}>
                {riskMeta.label} {alert ? `- ${alert.risk}/100` : ""}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Report Date</p>
              <p className="font-semibold text-foreground">{reportDate}</p>
            </div>
            {alert && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Alert Type</p>
                  <p className="font-semibold text-foreground">{alert.eventType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Coordinates</p>
                  <p className="flex items-center gap-1 font-semibold text-foreground">
                    <MapPin className="h-3 w-3" />
                    {alert.coords}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Area Affected</p>
                  <p className="font-semibold text-foreground">{alert.hectares} hectares</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Carbon</p>
                  <p className="font-semibold text-foreground">
                    {alert.estimatedCarbonTonnes ? `${alert.estimatedCarbonTonnes} tCO2e` : "Methodology unavailable"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Source</p>
                  <p className="font-semibold text-foreground">{alert.source}</p>
                </div>
              </>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Source and Freshness</h4>
            <div className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                <strong>Data mode:</strong> {mode === "live" ? "LIVE PUBLIC DATA" : mode === "loading" ? "LOADING LIVE DATA" : "FALLBACK DEMO DATA"}
              </p>
              <p>
                <strong>Generated at:</strong> {formatTimestamp(generatedAt)}
              </p>
              <p>
                <strong>Sources:</strong> {(sources.length ? sources : [alert?.source]).filter(Boolean).join(", ")}
              </p>
              {alert?.dataLineage?.length ? (
                <p>
                  <strong>Evidence chain:</strong> {alert.dataLineage.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Business Impact</h4>
            <div className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              {alert ? alert.businessImpact : "Select an alert to generate business context."}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Documented Buyer Links</h4>
            {alert?.historicalBuyerLinks?.length ? (
              <div className="space-y-3 text-xs text-muted-foreground">
                <p>{alert.supplyChainLinkSummary}</p>
                {alert.historicalBuyerLinks.map((link) => (
                  <div key={link.id} className="rounded-lg bg-muted/50 p-3">
                    <p>
                      <strong>{link.propertyName}</strong> · {link.owner}
                    </p>
                    <p>
                      <strong>Historical buyer link:</strong> {link.linkedBuyers.join(", ")}
                    </p>
                    <p>
                      <strong>Evidence summary:</strong> {link.evidenceSummary}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {link.confidenceLabel} · {link.matchingPrecision}
                    </p>
                    <p>
                      <strong>Source:</strong> <a href={link.sourceUrl} target="_blank" rel="noreferrer" className="underline">{link.sourceTitle}</a>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No documented buyer-link record is attached to this case.</p>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Evidence and Context</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              {alert ? (
                <>
                  <p>
                    <strong>Signal:</strong> {alert.why}
                  </p>
                  <p>
                    <strong>Threat profile:</strong> {alert.threat}
                  </p>
                  <p>
                    <strong>Land-use context:</strong> {alert.landUseContext}
                  </p>
                  {alert.carbonTracked ? (
                    <p>
                      <strong>Carbon estimate:</strong> {alert.estimatedCarbonTonnes} tCO2e at risk · {alert.carbonMethodology}
                    </p>
                  ) : (
                    <p>
                      <strong>Carbon estimate:</strong> Methodology coverage is unavailable for this alert class.
                    </p>
                  )}
                  {(alert.evidence || []).map((item) => (
                    <p key={item}>
                      <strong>Evidence:</strong> {item}
                    </p>
                  ))}
                </>
              ) : (
                <p>Select an alert from the dashboard to generate evidence context.</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Agent Reasoning</h4>
            {caseInsight ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>{caseInsight.title}:</strong> {caseInsight.summary || caseInsight.message}
                </p>
                {caseInsight.sections?.map((section) => (
                  <p key={section.label}>
                    <strong>{section.label}:</strong> {section.text}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No live agent reasoning is attached to this case yet.</p>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Recommended Actions</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              {recommendedActions.map((item, index) => (
                <p key={item}>
                  {index + 1}. <strong>{item}</strong>
                </p>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Uploaded Evidence</h4>
            {attachments.length ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                {attachments.map((attachment) => (
                  <p key={attachment.id}>
                    <strong>{attachment.fileName}:</strong> {attachment.analysis?.summary || attachment.message || attachment.status}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No uploaded file analyses are linked to this case.</p>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Next Review Step</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {alert ? alert.nextReviewStep : "Generate a report from a selected alert to create the next review step."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 gap-1.5"
              disabled={!alert}
              onClick={() => downloadReportPdf({ alert, mode, generatedAt, sources, caseInsight, attachments })}
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={!alert}
              onClick={() => printReport({ alert, mode, generatedAt, sources, caseInsight, attachments })}
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
