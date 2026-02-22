# Wattless

**Cut your GPU bill by 3x. Zero downtime. Zero hassle.**

Wattless is a FinOps & GreenOps platform that finds the cheapest, greenest GPU across cloud regions in real time. Spot pricing, carbon-aware scheduling, smart checkpointing.

**Devpost:** https://devpost.com/software/wattless

## Repository Structure

```
Wattless/
│
├── src/                    # Wattless Dashboard (React + Vite + Tailwind)
│   ├── components/         #   UI components (Hero, Dashboard, Map, Team...)
│   ├── pages/              #   Routes (Index, Dashboard, Simulate, Mapmonde)
│   ├── data/               #   NERVE data (servers, regions, scoring)
│   ├── hooks/              #   Custom React hooks
│   └── lib/                #   API client & utilities
│
├── backend/                # NERVE Engine (Python)
│   └── engine/             #   Scoring, scraping, checkpointing, LLM, timeshifter
│
├── supabase/               # Supabase Backend
│   ├── migrations/         #   Database schema (SQL)
│   └── functions/          #   Edge functions (scrape, simulate, optimize...)
│
├── EVE/                    # EVE — AI that creates AI models
│   ├── backend/            #   FastAPI + Modal GPU training + NERVE scan
│   ├── frontend/           #   React chat interface (split-screen)
│   └── README.md           #   EVE documentation
│
├── docs/                   # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SUPABASE_MCP_GUIDE.md
│   ├── TEST_RESULTS.md
│   └── vision/             #   Product vision & scraped data
│
├── archive/                # Previous versions (preserved)
│   └── frontend-v1/        #   Earlier frontend iteration
│
└── public/                 # Static assets
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Python, FastAPI, Supabase Edge Functions |
| GPU Engine | NERVE scoring (cost + carbon + availability + cooling) |
| EVE | Anthropic Claude API, Modal (serverless GPU), TinyLlama 1.1B + LoRA |

## Quick Start

### Wattless Dashboard
```bash
git clone https://github.com/Wasroy/Wattless.git
cd Wattless
npm install
npm run dev
```

### EVE (AI Model Creator)
```bash
# Backend
cd EVE/backend
pip install -r requirements.txt
cp .env.example .env   # Add your Anthropic API key
python eve.py           # Runs on :8001

# Frontend
cd EVE/frontend
npm install
npm run dev             # Runs on :5173
```

## Team

Four people. 22 hours. Hack Europe 2026.

- **Nicolas** — Backend & Infra
- **William** — Frontend & Design
- **Adrien** — Marketing & Business
- **Roland** — Storytelling & Finance

## Links

- [Devpost](https://devpost.com/software/wattless)
- [GitHub](https://github.com/Wasroy/Wattless)
