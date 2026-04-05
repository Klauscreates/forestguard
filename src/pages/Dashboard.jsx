import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import DashboardSidebar from "../components/command/DashboardSidebar";
import TopBar from "../components/command/TopBar";
import ReportModal from "../components/command/ReportModal";
import RiskMap from "../components/dashboard/RiskMap";
import CarbonImpactHero from "../components/dashboard/CarbonImpactHero";
import AgentConsoleSidecar from "../components/dashboard/AgentConsoleSidecar";
import { useAlerts } from "../hooks/use-alerts";
import { useLiveVoiceAgent } from "../hooks/use-live-voice-agent";
import { runAgentChat } from "../lib/forestguard-api";
import { forestGuardBusinessContext } from "../data/business-context";

function createClientStep({ tool, label, detail, status = "completed" }) {
  return {
    id: crypto.randomUUID(),
    tool,
    label,
    detail,
    status,
    timestamp: new Date().toISOString(),
  };
}

function buildClientErrorResponse(error, currentTask) {
  return {
    ok: false,
    mode: "error",
    model: null,
    title: "Agent request failed",
    summary: "The live agent request could not complete.",
    message: error.message,
    sections: [],
    recommendedActions: [],
    execution: {
      status: "error",
      currentTask,
      steps: [
        createClientStep({
          tool: "client.error",
          label: currentTask,
          detail: error.message,
          status: "failed",
        }),
      ],
      completedAt: new Date().toISOString(),
    },
  };
}

function formatCarbonTonnes(value) {
  if (!value) return "N/A";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} tCO2e`;
}

export default function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [caseInsight, setCaseInsight] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [lastExecutionStatus, setLastExecutionStatus] = useState("idle");
  const [lastExecutionTask, setLastExecutionTask] = useState("Awaiting live alert refresh");
  const [reviewCaseIds, setReviewCaseIds] = useState([]);
  const [agentConsoleOpen, setAgentConsoleOpen] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceDebug, setVoiceDebug] = useState(null);

  const lastAlertExecutionRef = useRef(null);
  const lastAnnouncedAlertRef = useRef(null);
  const {
    data,
    isLoading,
    isFetching,
  } = useAlerts();

  const chatMutation = useMutation({
    mutationFn: runAgentChat,
  });
  const runChatRequest = chatMutation.mutateAsync;

  const mode = isLoading ? "loading" : data?.mode || "fallback";
  const alerts = data?.alerts || [];
  const selectedAlertRecord = alerts.find((alert) => alert.id === selectedAlert) || alerts[0] || null;

  const dashboardSnapshot = useMemo(
    () => ({
      mode,
      generatedAt: data?.generatedAt || null,
      source: data?.sources?.[0] || null,
      summary: data?.summary || null,
      region: data?.region || null,
      selectedCase: selectedAlertRecord
        ? {
            id: selectedAlertRecord.id,
            title: selectedAlertRecord.title,
            zone: selectedAlertRecord.zone,
            risk: selectedAlertRecord.risk,
            hectares: selectedAlertRecord.hectares,
            source: selectedAlertRecord.source,
          }
        : null,
    }),
    [data?.generatedAt, data?.region, data?.sources, data?.summary, mode, selectedAlertRecord]
  );
  const reviewCaseSet = useMemo(() => new Set(reviewCaseIds), [reviewCaseIds]);
  const reviewCarbonTonnes = useMemo(
    () =>
      alerts.reduce(
        (total, alert) =>
          reviewCaseSet.has(alert.id) && alert.estimatedCarbonTonnes ? total + alert.estimatedCarbonTonnes : total,
        0
      ),
    [alerts, reviewCaseSet]
  );
  const reviewCount = useMemo(
    () => alerts.filter((alert) => reviewCaseSet.has(alert.id)).length,
    [alerts, reviewCaseSet]
  );

  const prependLogs = useCallback((entries = []) => {
    if (!entries.length) return;

    setAgentLogs((current) => {
      const next = [
        ...entries.map((entry) => ({
          ...entry,
          id: entry.id || crypto.randomUUID(),
        })),
        ...current,
      ];
      const seen = new Set();

      return next.filter((entry) => {
        const key = entry.id || `${entry.tool}-${entry.label}-${entry.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 120);
    });
  }, []);

  const stageCaseReview = useCallback((alertId) => {
    if (!alertId) return;
    setReviewCaseIds((current) => (current.includes(alertId) ? current : [alertId, ...current]));
  }, []);

  useEffect(() => {
    if (!alerts.length) return;

    if (!selectedAlert || !alerts.some((alert) => alert.id === selectedAlert)) {
      setSelectedAlert(alerts[0].id);
    }
  }, [alerts, selectedAlert]);

  useEffect(() => {
    if (!selectedAlertRecord) {
      setCaseInsight(null);
      setChatMessages([]);
      return;
    }

    setCaseInsight(null);
    setChatMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        response: {
          ok: true,
          mode: "local",
          model: null,
          title: "Forest ready",
          summary: "I’m focused on this case. What would you like help with: simplify the data, cross-check the evidence, or find new related signals?",
          message: "I’m focused on this case. What would you like help with: simplify the data, cross-check the evidence, or find new related signals?",
          sections: [],
          recommendedActions: [],
          execution: null,
        },
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [selectedAlertRecord?.id]);

  useEffect(() => {
    if (!data?.execution?.completedAt) return;
    if (lastAlertExecutionRef.current === data.execution.completedAt) return;

    lastAlertExecutionRef.current = data.execution.completedAt;
    prependLogs(data.execution.steps || []);
    setLastExecutionStatus(data.execution.status || (data.mode === "live" ? "completed" : "fallback"));
    setLastExecutionTask(data.execution.currentTask || (data.mode === "live" ? "Monitoring live public alerts" : "Using fallback dataset"));
  }, [data?.execution, data?.mode, prependLogs]);

  const submitQuestion = useCallback(async (question, source = "ui.chat") => {
    const trimmed = question.trim();

    if (!trimmed || !selectedAlertRecord || chatMutation.isPending) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    prependLogs([
      createClientStep({
        tool: source,
        label: source === "voice.command" ? "Submitted wake-word voice command" : "Submitted analyst chat question",
        detail: trimmed,
        status: "running",
      }),
    ]);
    setLastExecutionTask(source === "voice.command" ? "Answering wake-word voice command" : "Answering analyst chat question");

    try {
      const response = await runChatRequest({
        alertId: selectedAlertRecord.id,
        question: trimmed,
        alertSnapshot: selectedAlertRecord,
        dashboardSnapshot,
      });

      setChatMessages((current) => [
        ...current.filter((message) => message.response?.mode !== "local"),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          response,
          timestamp: new Date().toISOString(),
        },
      ]);
      prependLogs(response.execution?.steps || []);
      setLastExecutionStatus(response.execution?.status || (response.ok ? "completed" : response.mode));
      setLastExecutionTask(response.execution?.currentTask || "Completed agent chat request");
    } catch (error) {
      const failure = buildClientErrorResponse(error, "Agent chat failed");
      setChatMessages((current) => [
        ...current.filter((message) => message.response?.mode !== "local"),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          response: failure,
          timestamp: new Date().toISOString(),
        },
      ]);
      prependLogs(failure.execution.steps);
      setLastExecutionStatus("error");
      setLastExecutionTask("Agent chat failed");
    }
  }, [chatMutation.isPending, dashboardSnapshot, prependLogs, runChatRequest, selectedAlertRecord]);

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    await submitQuestion(chatInput, "ui.chat");
  };

  const { supported: voiceSupported, transcript: voiceTranscript, debug: liveVoiceDebug } = useLiveVoiceAgent({
    enabled: voiceEnabled,
    selectedAlert: selectedAlertRecord,
    dashboardSnapshot,
    onStatusChange: setVoiceStatus,
    onUserUtterance: (command) => {
      setChatMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: command,
          timestamp: new Date().toISOString(),
        },
      ]);
      prependLogs([
        createClientStep({
          tool: "voice.command",
          label: "Captured voice command",
          detail: command,
          status: "completed",
        }),
      ]);
      setLastExecutionTask("Streaming live voice request");
    },
        onAgentResponse: (responseText, commandText) => {
      const responsePayload = {
        ok: true,
        mode: "gemini-live",
        model: liveVoiceDebug?.model || "gemini-live",
        title: "Live voice response",
        summary: responseText,
        message: responseText,
        sections: [],
        recommendedActions: [],
        execution: {
          status: "completed",
          currentTask: "Completed live voice response",
          steps: [
            createClientStep({
              tool: "voice.live",
              label: "Completed live voice response",
              detail: commandText || "Wake-word request",
            }),
          ],
          completedAt: new Date().toISOString(),
        },
      };

      setChatMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          response: responsePayload,
          timestamp: new Date().toISOString(),
        },
      ]);
      prependLogs(responsePayload.execution.steps);
      setLastExecutionStatus("completed");
      setLastExecutionTask("Completed live voice response");
    },
    onLog: (entry) => {
      prependLogs([createClientStep(entry)]);
    },
  });

  useEffect(() => {
    setVoiceDebug(liveVoiceDebug);
  }, [liveVoiceDebug]);

  const agentStatus = useMemo(() => {
    if (isFetching || chatMutation.isPending) {
      return "running";
    }
    if (lastExecutionStatus === "error") {
      return "error";
    }
    if (lastExecutionStatus === "unavailable") {
      return "unavailable";
    }
    return "idle";
  }, [chatMutation.isPending, isFetching, lastExecutionStatus]);

  const currentTask = useMemo(() => {
    if (chatMutation.isPending) return "Answering analyst chat question";
    if (isFetching) return "Refreshing live public alerts";
    if (lastExecutionTask) return lastExecutionTask;
    if (selectedAlertRecord) return "Forest is ready to help with the selected case";
    return mode === "live" ? "Monitoring live public alerts" : "Awaiting live alert refresh";
  }, [chatMutation.isPending, isFetching, lastExecutionTask, mode, selectedAlertRecord]);

  const openReportForSelectedCase = useCallback(() => {
    if (selectedAlertRecord) {
      stageCaseReview(selectedAlertRecord.id);
    }
    setReportOpen(true);
  }, [selectedAlertRecord, stageCaseReview]);

  useEffect(() => {
    if (!voiceEnabled || !alerts.length) return;

    const topAlert = alerts[0];
    if (!topAlert?.id || lastAnnouncedAlertRef.current === topAlert.id) return;
    lastAnnouncedAlertRef.current = topAlert.id;

    prependLogs([
      createClientStep({
        tool: "voice.monitor",
        label: "Updated the live voice session with the latest top alert",
        detail: `${topAlert.title} · ${formatCarbonTonnes(topAlert.estimatedCarbonTonnes)}`,
      }),
    ]);
  }, [alerts, prependLogs, voiceEnabled]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#081120] text-white">
      <DashboardSidebar
        summary={data?.summary}
        alerts={alerts}
        mode={mode}
        isLoading={isLoading}
        selectedAlert={selectedAlertRecord}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          onGenerateReport={openReportForSelectedCase}
          mode={mode}
          generatedAt={data?.generatedAt}
          sources={data?.sources}
          canGenerateReport={Boolean(selectedAlertRecord)}
          agentConsoleOpen={agentConsoleOpen}
          onToggleAgentConsole={() => setAgentConsoleOpen((current) => !current)}
        />

        <div className={`grid min-h-0 flex-1 gap-4 overflow-hidden p-4 ${agentConsoleOpen ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "xl:grid-cols-[minmax(0,1fr)]"}`}>
          <div className="grid min-h-0 gap-4 xl:grid-rows-[minmax(220px,0.52fr)_minmax(0,1fr)]">
            <CarbonImpactHero
              summary={data?.summary}
              alertCount={alerts.length}
              reviewCarbonTonnes={reviewCarbonTonnes}
              reviewCount={reviewCount}
              selectedAlert={selectedAlertRecord}
              mode={mode}
              generatedAt={data?.generatedAt}
              methodologySource={forestGuardBusinessContext.carbonMethodology.sourceLabel}
            />

            <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
              <div className="min-h-0 xl:aspect-square">
                <RiskMap
                  selectedAlertId={selectedAlertRecord?.id}
                  onSelectAlert={setSelectedAlert}
                  alerts={alerts}
                  generatedAt={data?.generatedAt}
                  sources={data?.sources || []}
                  mode={mode}
                  isLoading={isLoading}
                />
              </div>

              <div className="min-h-0 overflow-hidden rounded-[26px] border border-white/10 bg-[#091424] p-4">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="shrink-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Selected Case</p>
                    <p className="mt-1 text-[11px] text-slate-400">The active case, its impact, and what to do next.</p>
                  </div>

                  {selectedAlertRecord ? (
                    <div className="mt-4 min-h-0 flex-1 overflow-y-auto space-y-4">
                      <div className="rounded-[22px] border border-cyan-300/15 bg-cyan-300/6 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Current Case</p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedAlertRecord.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{selectedAlertRecord.zone}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedAlertRecord.discovery?.label ? (
                            <div className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-100">
                              {selectedAlertRecord.discovery.label}
                            </div>
                          ) : null}
                          {selectedAlertRecord.weakSignals?.length ? (
                            <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-slate-300">
                              {selectedAlertRecord.weakSignals.length} external signal{selectedAlertRecord.weakSignals.length === 1 ? "" : "s"}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Land Affected</p>
                          <p className="mt-2 text-lg font-semibold text-white">{selectedAlertRecord.hectares} ha</p>
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Case Impact</p>
                          <p className="mt-2 text-lg font-semibold text-white">{formatCarbonTonnes(selectedAlertRecord.estimatedCarbonTonnes)}</p>
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Recent Activity</p>
                          <p className="mt-2 text-lg font-semibold capitalize text-white">{selectedAlertRecord.trend}</p>
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Priority</p>
                          <p className="mt-2 text-lg font-semibold text-white">{selectedAlertRecord.risk}/100</p>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                        <div className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">What Changed</p>
                          <p className="mt-3 text-sm leading-7 text-slate-200">
                            {caseInsight?.summary || selectedAlertRecord.businessImpact}
                          </p>
                          {selectedAlertRecord.discovery?.summary ? (
                            <p className="mt-3 text-xs leading-6 text-cyan-100">{selectedAlertRecord.discovery.summary}</p>
                          ) : null}
                        </div>
                        <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-300/8 p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100">Avoidable Emissions</p>
                          <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] text-white">
                            {selectedAlertRecord.carbonTracked ? formatCarbonTonnes(selectedAlertRecord.estimatedCarbonTonnes) : "N/A"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-emerald-50">
                            {selectedAlertRecord.carbonTracked
                              ? "We found new clearing in a protected area. Acting now can stop these emissions from entering the supply chain."
                              : "This case is outside the current emissions methodology coverage."}
                          </p>
                        </div>
                      </div>

                      {selectedAlertRecord.weakSignals?.length ? (
                        <div className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">External Signals</p>
                          <div className="mt-3 space-y-3">
                            {selectedAlertRecord.weakSignals.map((signal) => (
                              <div key={signal.link} className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs font-semibold text-white">{signal.title}</p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {signal.sourceName} · {signal.category}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-[22px] border border-white/10 bg-[#08111f] p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">What To Do</p>
                        <p className="mt-3 text-sm leading-7 text-slate-200">
                          {caseInsight?.recommendedActions?.[0] || selectedAlertRecord.action}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <div className={`rounded-full px-2.5 py-1 text-[10px] ${
                            mode === "live" ? "bg-emerald-400/15 text-emerald-100" : mode === "loading" ? "bg-cyan-400/15 text-cyan-100" : "bg-amber-400/15 text-amber-100"
                          }`}>
                            {mode === "live" ? "LIVE PUBLIC DATA" : mode === "loading" ? "LOADING LIVE DATA" : "FALLBACK DEMO DATA"}
                          </div>
                          <div className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-slate-300">
                            {data?.sources?.[0] || "Source unavailable"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-1 items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-[#08111f] px-6 text-center text-sm text-slate-400">
                      Select an alert to load the active case.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {agentConsoleOpen ? (
            <div className="min-h-0">
              <AgentConsoleSidecar
                alerts={alerts}
                selectedAlert={selectedAlertRecord}
                onSelectAlert={setSelectedAlert}
                onGenerateReport={openReportForSelectedCase}
                mode={mode}
                agentStatus={agentStatus}
                currentTask={currentTask}
                voiceEnabled={voiceEnabled}
                voiceSupported={voiceSupported}
                voiceStatus={voiceStatus}
                voiceTranscript={voiceTranscript}
                voiceDebug={voiceDebug}
                onToggleVoice={() => setVoiceEnabled((current) => !current)}
                logs={agentLogs}
                chatMessages={chatMessages}
                caseInsight={caseInsight}
                inputValue={chatInput}
                onInputChange={setChatInput}
                onSubmit={handleChatSubmit}
                isPending={chatMutation.isPending}
              />
            </div>
          ) : null}
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        alert={selectedAlertRecord}
        mode={mode}
        generatedAt={data?.generatedAt}
        sources={data?.sources || []}
        caseInsight={caseInsight}
        attachments={[]}
      />
    </div>
  );
}
