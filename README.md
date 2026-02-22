# Wattless

**Cut your GPU bill by 3x. Zero downtime. Zero hassle.**

Wattless is a FinOps & GreenOps platform that finds the cheapest, greenest GPU across cloud regions in real time. Spot pricing, carbon-aware scheduling, smart checkpointing.

**Devpost:** https://devpost.com/software/wattless

## What's inside

```
Wattless/
├── src/              # Frontend — React + Vite + Tailwind + shadcn/ui
├── backend/          # NERVE engine — scoring, scraping, checkpointing
└── EVE/              # EVE — AI that creates AI models from conversation
    ├── backend/      # FastAPI + Modal GPU training + NERVE scan
    └── frontend/     # React chat interface
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Python, FastAPI, Supabase |
| GPU Engine | NERVE scoring (cost + carbon + availability + cooling) |
| EVE | Anthropic Claude API, Modal (serverless GPU), TinyLlama 1.1B + LoRA |

## Quick Start

```bash
git clone https://github.com/Wasroy/Wattless.git
cd Wattless
npm install
npm run dev
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
