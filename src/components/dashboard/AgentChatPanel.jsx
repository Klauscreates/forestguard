import { Bot, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function getAgentBadge(lastAssistantResponse) {
  if (!lastAssistantResponse) {
    return { label: "Ready for case chat", tone: "bg-white/10 text-slate-200" };
  }

  if (lastAssistantResponse.response?.mode === "gemini") {
    return { label: "Gemini live", tone: "bg-emerald-400/15 text-emerald-100" };
  }

  if (lastAssistantResponse.response?.mode === "unavailable") {
    return { label: "Gemini unavailable", tone: "bg-amber-400/15 text-amber-100" };
  }

  return { label: "Agent error", tone: "bg-red-400/15 text-red-100" };
}

export default function AgentChatPanel({
  alert,
  messages = [],
  inputValue,
  onInputChange,
  onSubmit,
  isPending,
}) {
  const lastAssistantResponse = [...messages].reverse().find((message) => message.role === "assistant");
  const badge = getAgentBadge(lastAssistantResponse);
  const disabled = !alert || isPending;

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#091424] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-200" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Agent Chat</p>
            <p className="truncate text-[11px] text-slate-400">
              {alert ? `Current case: ${alert.title}` : "Select an alert to open live case chat"}
            </p>
          </div>
        </div>
        <Badge className={cn("border-0 text-[10px]", badge.tone)}>{badge.label}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="ml-auto max-w-[85%] rounded-[22px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">You</p>
                    <p className="mt-2 text-sm leading-6 text-white">{message.text}</p>
                  </div>
                );
              }

              const response = message.response;
              return (
                <div key={message.id} className="max-w-[92%] rounded-[22px] border border-white/10 bg-[#08111f] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">ForestGuard Agent</p>
                    <Badge
                      className={cn(
                        "border-0 text-[10px]",
                        response?.mode === "gemini"
                          ? "bg-emerald-400/15 text-emerald-100"
                          : response?.mode === "unavailable"
                            ? "bg-amber-400/15 text-amber-100"
                            : "bg-red-400/15 text-red-100"
                      )}
                    >
                      {response?.mode === "gemini" ? "Gemini" : response?.mode === "unavailable" ? "Unavailable" : "Error"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{response?.title || "Agent response"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {response?.summary || response?.message || "No live response body was returned."}
                  </p>

                  {response?.sections?.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {response.sections.map((section) => (
                        <div key={section.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">{section.label}</p>
                          <p className="mt-2 text-xs leading-5 text-slate-300">{section.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-[#08111f] px-6 py-10 text-center">
            <div>
              <p className="text-sm font-medium text-white">Ask the live agent about the selected case.</p>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                The agent uses the current alert, dashboard state, and any analyzed uploads. No seeded chat history is shown.
              </p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-white/10 px-4 py-4">
        <div className="space-y-3">
          <Textarea
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={!alert}
            rows={4}
            placeholder={
              alert
                ? "Ask what changed, how it affects business, or what procurement should do next..."
                : "Select an alert to start a real agent conversation."
            }
            className="resize-none border-white/10 bg-[#08111f] text-white placeholder:text-slate-500 focus-visible:ring-cyan-300/40"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!disabled) {
                  onSubmit(event);
                }
              }
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              {alert ? "Live case context is attached to this message." : "Case context is required before the agent can respond."}
            </p>
            <Button type="submit" disabled={disabled} className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
