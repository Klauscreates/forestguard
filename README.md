# ForestGuard 🌿
### AI-Powered Forensic Supply Chain Agent for Deforestation Risk Detection
**Innovation Hacks 2.0 — ASU | April 3–5, 2026 | Amazon Sustainability Track**

> "ForestGuard helps Amazon decouple business growth from environmental impact by automating the prevention of high-risk procurement before it hits the ledger."

---

## 🌍 The Problem

Amazon's emissions are **up 33% since 2019** despite their Net-Zero 2040 pledge. 74% of their total carbon footprint comes from Scope 3 indirect supply chain emissions. The root cause: **cattle laundering**.

- 80% of Amazon deforestation is driven by cattle ranching *(CSIS, 2023)*
- 50% of deforestation happens on **indirect Birth Farms** — invisible to every standard audit tool *(CSIS · HRW, 2025)*
- EUDR (2026) now requires farm-level deforestation-free proof per SKU — fines up to **5% of annual revenue**

Procurement teams have no real-time tool to catch this before a purchase order ships.

---

## 🛰 What ForestGuard Does

ForestGuard is an **agentic forensic tool** that turns a satellite deforestation signal into a procurement decision in one loop:

1. **DETER detects** a clearing alert in a known Buying Zone
2. **Ingest Layer scores it**: hectares × carbon density = tCO₂e at risk — calculated before anyone opens the dashboard
3. **Procurement team sees** the alert, carbon number, and alternative low-risk suppliers
4. **They block the PO** — the forest stays standing

### Measurable Environmental Impact
- 1 ha Amazon primary forest kept standing = **150–300 tCO₂e prevented** *(IPCC AR6)*
- 10 procurement interventions/year = **600+ cars off the road for a full year** *(EPA emissions data)*

---

## 🧠 Architecture

```
INPE DETER ──▶ GET /api/alerts (normalize + score + EUDR check + Fallback Gate)
               ──▶ React Dashboard (RiskMap · Carbon KPI · Case Card · Command Center)
                   ──▶ POST /api/ask (Forest Router ──▶ Prompt Composer 3-layer sandwich)
                       ──▶ Amazon Bedrock Claude 3 Sonnet (forensic reasoning JSON)
                           ──▶ Action: Letter · SKU flag · PO blocked · DB logged
               + Gemini Live Voice (ephemeral token · circuit breaker · speech recognition)
```

### The Reasoning Sandwich
Every AI query is a 3-layer prompt:
- **SYSTEM**: Amazon sustainability policy persona + intervention rules
- **MIDDLE**: Live case data + dashboard snapshot + carbon scores + policy corpus
- **BOTTOM**: User natural language question or voice transcript

### Fallback Gate
If DETER live feed is unavailable → dashboard shows visible **LIVE vs FALLBACK** badge. No silent failures.

### Buyer-Link Zone Proxy
No private farm GPS needed. The system monitors high-risk **Buying Zones** tied to known Amazon procurement partners (JBS, Marfrig). Early-warning system — not a final verdict.

---

## 🗂 Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Reasoning | Amazon Bedrock — Claude 3 Sonnet |
| Vision + Voice | Gemini 1.5 Pro + Gemini Live |
| Satellite Data | INPE DETER API · GLAD/Landsat · Sentinel-2 SAR (RADD) |
| Protected Areas | APA Triunfo do Xingu boundary GeoJSON |
| Frontend | React + Vite |
| Deployment | Vercel |
| Backend / DB | Base44 (serverless functions · entity DB · alert logging) |
| Compliance | EUDR Article 3 · IPCC AR6 carbon methodology |

---

## 🚀 Live Demo

**Live App:** https://techpartnerapp.base44.app/ForestGuard

### Demo Walkthrough (6 steps)
1. Drop satellite image + AgriSul supplier ledger into the drop zones
2. Select **Pará Basin — AgriSul Commodities** (Risk score 91/100)
3. Run **Forensic Analysis**
4. Finding: 87ha cleared · 15% ledger discrepancy · Birth Farm burn scar 12km NE
5. Portuguese clarification letter auto-drafted · SKU CAT-BRA-4821 flagged
6. Ask by voice: *"Why is this flagged?"* → Gemini Live responds with EUDR Article 3 + 3 alternative suppliers

---

## 📦 Setup & Installation

### Prerequisites
- Node.js 18+
- AWS account with Bedrock access (Claude 3 Sonnet enabled)
- Google AI Studio API key (Gemini)

```bash
git clone https://github.com/Klauscreates/forestguard.git
cd forestguard
npm install
cp .env.template .env
# Fill in your API keys
npm run dev
```

---

## 📊 Data Sources

| Source | Type | Usage |
|--------|------|-------|
| INPE TerraBrasilis DETER | Public REST API | Real-time deforestation alerts |
| APA Triunfo do Xingu | GeoJSON | Protected area boundary overlay |
| GLAD/Landsat (GFW) | Public API | Alert cross-verification |
| Sentinel-2 SAR (RADD) | Public | Cloud-piercing deforestation alerts |
| Trase.earth | Public | Cattle deforestation by trader/municipality |

---

## 📚 Sources & References

- Amazon 2023 Sustainability Report
- CSIS: Cattle Supply Chains and Deforestation of the Amazon (2023)
- Human Rights Watch: Tainted — JBS and EU Exposure (2025)
- Mongabay: Amazon tipping point analysis (2026)
- IPCC AR6 Working Group I — carbon density methodology
- EU Deforestation Regulation (EUDR) — Supply Chain Brain (2026)
- AWS Blog: SeloVerde uses geospatial AI/ML on AWS (Amazon RNCF)
- EPA: Greenhouse Gas Equivalencies Calculator

---

## 👥 Team

Built at Innovation Hacks 2.0 — ASU, April 2026

---

## 📄 License

MIT
