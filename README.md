# ForestGuard 🌿
### AI-Powered Forensic Supply Chain Agent for Deforestation Risk Detection
**Innovation Hacks 2.0 — ASU | April 3–5, 2026 | Amazon Sustainability Track**

> "ForestGuard converts public forest-loss signals into decision-ready sourcing intelligence for procurement, compliance, and sustainability teams."

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Klauscreates/forestguard&env=AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION,BEDROCK_MODEL_ID,GEMINI_API_KEY,GFW_API_KEY&envDescription=API%20keys%20required%20to%20run%20ForestGuard&envLink=https://github.com/Klauscreates/forestguard/blob/main/.env.template&project-name=forestguard&repository-name=forestguard)
[![GitHub](https://img.shields.io/github/last-commit/Klauscreates/forestguard?color=22c55e)](https://github.com/Klauscreates/forestguard)

---

## 🌍 The Problem

Companies sourcing beef from the Amazon can miss early forest-loss risk because the data is technical, fragmented, and disconnected from day-to-day procurement workflows. 50% of deforestation risk is invisible — it happens on indirect "birth farms" that never appear in standard audits.

- 80% of Amazon deforestation is driven by cattle ranching *(CSIS, 2023)*
- Half of Pará's cattle are reared on illegally deforested land *(Reuters, 2025)*
- JBS does not track its indirect cattle suppliers *(Human Rights Watch, 2025)*
- EUDR (December 2026) requires farm-level deforestation-free proof per SKU

---

## 🛰 What ForestGuard Does

ForestGuard is a procurement intelligence tool that pulls live deforestation alerts from INPE's DETER API, scores them for carbon exposure and procurement risk, and lets an AI agent help sourcing teams decide what to do — in plain language.

### Core Flow
1. **Live alerts** — pulled from INPE TerraBrasilis DETER WFS API, filtered to São Félix do Xingu bbox
2. **Scoring** — each alert gets a risk level (critical/high/medium/low), carbon exposure in tCO₂e, and APA protected-area flag
3. **Dashboard** — risk map, carbon KPI hero, alert list, agent console sidecar
4. **Forest Agent** — ask questions about selected alerts in natural language; responds with structured sections, recommended actions, and carbon context
5. **File analysis** — upload a supplier document; Gemini 2.5 Flash reads it against the active alert and returns key findings
6. **Voice** — Gemini Live audio session (ephemeral token, circuit breaker) for spoken commands
7. **Weak signals** — background RSS fetch from Google News for Brazil enforcement/regulatory headlines

---

## 🧠 Architecture

```
INPE TerraBrasilis DETER WFS
  └─▶ GET /api/alerts
        ├─ normalize + score + APA boundary check
        ├─ supply chain link overlay (documented buyer links)
        ├─ weak signal headlines (Google News RSS)
        └─ fallback static dataset if DETER is unavailable

React Dashboard (Vite + Tailwind)
  ├─ RiskMap — leaflet map, alert pins, APA boundary
  ├─ CarbonImpactHero — live tCO₂e at risk
  ├─ AgentConsoleSidecar — Forest agent chat
  └─ ReportModal — printable due-diligence scaffold

POST /api/ask  (Forest Agent)
  ├─ Forest Router — classifies query route
  ├─ Prompt Composer — 3-layer sandwich (system · case context · user question)
  ├─ Policy RAG — retrieves Amazon sustainability policy context
  └─ Reasoning Provider — Gemini 2.5 Flash (default) or Amazon Bedrock (if configured)

POST /api/file-analysis  (Supplier document analysis)
  └─ Gemini 2.5 Flash reads file content against active alert

POST /api/live-token  (Voice)
  └─ Gemini Live ephemeral token — model: gemini-2.5-flash-native-audio-preview

GET /api/alerts — weak signals
  └─ _weak-signals.js — Google News RSS, scored and ranked
```

### Reasoning Provider
- Default: **Gemini 2.5 Flash** via REST API
- Optional: **Amazon Bedrock** (Nova Lite or Claude 3 Sonnet) via AWS Signature V4 — activated automatically if `AWS_ACCESS_KEY_ID` is set
- Route-aware: Bedrock preferred for `policy_rag` and `synthesis` routes when available

### Fallback Gate
If DETER live feed is unavailable → app loads static fallback alert dataset with visible `LIVE / FALLBACK` badge. No silent failures.

---

## 🗂 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| AI Reasoning | Gemini 2.5 Flash (default) · Amazon Bedrock Nova Lite / Claude 3 Sonnet (optional) |
| Voice | Gemini Live — native audio, ephemeral token |
| File Analysis | Gemini 2.5 Flash |
| Satellite Data | INPE TerraBrasilis DETER WFS API |
| Protected Areas | APA Triunfo do Xingu boundary GeoJSON |
| Supply Chain Data | Documented buyer links (Marfrig, Frigol, JBS — Repórter Brasil sourced) |
| Policy Context | Amazon sustainability commitments + EUDR Article 3 |
| Deployment | Vercel (serverless API routes + static frontend) |

---

## 📦 Setup

```bash
git clone https://github.com/Klauscreates/forestguard.git
cd forestguard
npm install
cp .env.template .env
# Fill in your API keys (Gemini required; Bedrock optional)
npm run dev
```

---

## 📊 Data Sources

| Source | Usage |
|--------|-------|
| INPE TerraBrasilis DETER WFS | Live deforestation alerts — São Félix do Xingu bbox |
| APA Triunfo do Xingu GeoJSON | Protected area boundary — point-in-polygon check per alert |
| Sao Felix do Xingu boundary GeoJSON | Municipality boundary |
| Google News RSS | Weak signals — Brazil enforcement/regulatory headlines |
| Repórter Brasil (via supply-chain-links.js) | Documented historical buyer links (Fazenda Limeira → Marfrig, Frigol) |
| IPCC AR6 | Carbon density methodology for tCO₂e calculations |

---

## 📚 Sources

- Amazon 2023 Sustainability Report
- CSIS: Cattle Supply Chains and Deforestation of the Amazon (2023)
- Human Rights Watch: Tainted — JBS Investigation (October 2025)
- Reuters: Half of Pará's cattle reared on illegally deforested land (December 2025)
- The Guardian: The life and death of a laundered cow (April 2025)
- IPCC AR6 Working Group I — carbon density methodology
- EUDR Article 3 — EU Deforestation Regulation (December 2026)
- Repórter Brasil: JBS, Marfrig e Frigol supply chain investigation

---

## 📄 License

MIT
