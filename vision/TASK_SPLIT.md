# NERVE — Hackathon Task Split (v4.0)

**Paris Innov Hack — Objectif : 1ere place**
**Equipe : Nicolas (Back/IA/Checkpointing) + William (Front/Dashboard/Demo UX)**
**Vision : v4.0 "Bulletproof" — Intra-Region + Time-Shifting + Smart Checkpointing**

---

## CE QUI A CHANGE (v3 → v4)

On ne deplace plus les calculs dans le monde entier. On respecte la **Data Gravity** :
- **AZ-Hopping** : on bouge le calcul entre les batiments d'une meme ville (Paris AZ-A → AZ-B → AZ-C). Latence < 1ms, egress fees = 0.
- **Time-Shifting** : on attend la nuit (heures creuses) pour lancer les calculs quand les prix Spot s'effondrent.
- **Smart Checkpointing** : si AWS coupe le serveur Spot, on sauvegarde les poids du modele IA (PyTorch) sur S3 et on reprend sur un autre serveur exactement la ou on s'etait arrete. Zero perte.

---

## ARCHITECTURE HACKATHON

```
                    [FRONT — William]
                    React + Vite + Tailwind + shadcn + recharts
                    Landing + Dashboard Live + Demo Wizard
                            |
                            | API REST (JSON) + WebSocket
                            |
                    [BACK — Nicolas]
                    Python FastAPI
                    ├── Local Intelligence Engine (prix AZ + energie locale)
                    ├── AZ-Hopping Scheduler (scoring par AZ)
                    ├── Smart Checkpointing Simulator
                    ├── Time-Shifting Engine (deadline + heures creuses)
                    └── WebSocket (feed temps reel → dashboard)
```

**Stack hackathon :**
- Back : **Python FastAPI** (plus rapide a coder que Go pour un hackathon)
- Front : **React/Vite/Tailwind/shadcn** (deja en place)
- Temps reel : **WebSocket**
- DB : **JSON en memoire** ou **SQLite** (hackathon)
- APIs reelles : Electricity Maps, OpenWeather, Azure Retail Prices

---

## NICOLAS — Backend + IA + Smart Checkpointing

### BLOC 1 : API Backend (FastAPI)

**Dossier : `backend/`**

| Route | Methode | Ce que ca fait | Hardcode ? |
|-------|---------|----------------|------------|
| `/api/region` | GET | Retourne la region active du client (ex: eu-west-3 Paris) avec ses 3 AZ et leurs prix Spot GPU en temps reel | Region hardcodee, prix scrapes ou simules |
| `/api/azs` | GET | Liste les AZ de la region avec : prix spot, carbon intensity, load, score | Mix reel + simule |
| `/api/azs/{az_id}` | GET | Detail d'une AZ : prix par type d'instance GPU, meteo locale, mix energetique | Mix |
| `/api/simulate` | POST | Coeur de la demo : le user envoie un job (type, taille, deadline, eco-mode), Nerve retourne l'AZ optimale + le créneau horaire optimal + economies | Algo reel |
| `/api/checkpoint/simulate` | POST | Simule une interruption Spot : montre le save checkpoint → evacuation → reprise sur AZ voisine | Simule mais scenario reel |
| `/api/dashboard/stats` | GET | Stats : $ economises, interruptions gerees, CO2 evite, heures de time-shifting | Semi-hardcode |
| `/api/timeshifting/plan` | POST | Prend un job + deadline, retourne le plan optimal (a quelle heure lancer, sur quelle AZ, prix estime) | Algo reel |
| `/ws/feed` | WebSocket | Push en continu : prix AZ, migrations, alertes interruption, checkpoints | Reel |

### BLOC 2 : Local Intelligence Engine (Le Radar)

**Dossier : `backend/engine/`**

On scrape **localement** (une seule region, 3 AZ). C'est plus realiste et plus impressionnant.

| Source | API / Methode | Ce qu'on recupere | Hardcode ? |
|--------|--------------|-------------------|------------|
| **Prix Spot GPU** | AWS EC2 Spot Price History (boto3) OU dataset hardcode | Prix par AZ (eu-west-3a/b/c) pour g4dn, p3, p4d | Hardcode un dataset de prix qui fluctue de facon realiste |
| **Energie locale** | Electricity Maps API (gratuit) | gCO2/kWh en France en temps reel | API reelle — super impressionnant en demo |
| **Meteo locale** | OpenWeatherMap (gratuit) | Vent, soleil a Paris → correle avec l'energie verte | API reelle |
| **Heures creuses** | Hardcode | Profil tarifaire : prix bas entre 1h-5h, pics a 19h | Hardcode courbe realiste |

**Fichier `backend/engine/data/az_config.json` :**
```json
{
  "region": "eu-west-3",
  "region_name": "Paris",
  "azs": [
    {"id": "eu-west-3a", "name": "Paris AZ-A", "lat": 48.86, "lng": 2.35},
    {"id": "eu-west-3b", "name": "Paris AZ-B", "lat": 48.90, "lng": 2.28},
    {"id": "eu-west-3c", "name": "Paris AZ-C", "lat": 48.82, "lng": 2.42}
  ],
  "gpu_instances": ["g4dn.xlarge", "g4dn.2xlarge", "p3.2xlarge"]
}
```

### BLOC 3 : AZ-Hopping Scorer

**Fichier : `backend/engine/scoring.py`**

Score par AZ (le plus BAS = meilleur) :

```python
score = (
    w_price  * normalize(spot_price)          # 50% — prix du GPU Spot dans cette AZ
  + w_carbon * normalize(carbon_intensity)     # 20% — intensite carbone locale
  + w_load   * normalize(az_load)              # 15% — charge de l'AZ
  + w_time   * normalize(time_penalty)         # 15% — bonus si heures creuses
)
```

Pour la demo : les poids sont modifiables via slider (mode "Cheap" vs "Eco" vs "Balanced").

### BLOC 4 : Smart Checkpointing Simulator

**Fichier : `backend/engine/checkpointing.py`**

C'est le truc qui nous differencie de TOUT LE MONDE. Le scenario de demo :

```
T+0s   : Job "fine-tune-llama-7b" tourne sur AZ-A (Spot, $0.52/h)
T+0s   : Nerve surveille http://169.254.169.254/latest/meta-data/spot/instance-action
T+45s  : ⚠️ AWS SIGNAL : "Interruption dans 120 secondes"
T+46s  : Nerve → PyTorch : "torch.save(model.state_dict(), 's3://nerve-checkpoints/...')"
T+52s  : Checkpoint sauve (6 secondes pour 7B params)
T+53s  : Nerve → Cordon AZ-A, lance nouveau GPU Spot sur AZ-B ($0.48/h)
T+60s  : Nouveau pod up, telecharge le checkpoint depuis S3
T+65s  : Reprise de l'entrainement exactement a l'epoch 847/2000
T+120s : AWS coupe AZ-A. Nerve a deja evacue. Zero perte.
```

**Pour le back** : creer un endpoint qui simule ce timeline step-by-step et envoie les events via WebSocket pour que William les anime cote front.

### BLOC 5 : Time-Shifting Engine

**Fichier : `backend/engine/timeshifter.py`**

Le user dit : "J'ai besoin de ce modele entraine pour demain 8h."

Nerve calcule :
1. Duree estimee du job (ex: 6h de GPU)
2. Fenetre dispo : maintenant (19h) → deadline (8h) = 13h de marge
3. Creux tarifaires : entre 1h et 5h les prix Spot tombent de $1.20/h a $0.35/h
4. Decision : "Lancer a 1h30 du matin. Fin estimee : 7h30. Economie : $5.10/h x 6h = $30.60"

**Retourne** un plan avec un graphique de prix prevu sur 24h et le creneau optimal surligne.

### BLOC 6 : WebSocket Feed

**Fichier : `backend/ws/feed.py`**

Push vers le front toutes les 3-5 secondes :

```json
{
  "type": "az_price_update",
  "az": "eu-west-3a",
  "instance": "g4dn.xlarge",
  "old_price": 0.52,
  "new_price": 0.48,
  "carbon_gco2": 58,
  "score": 0.31
}
```

```json
{
  "type": "checkpoint_event",
  "job_id": "fine-tune-llama-7b",
  "status": "saving",
  "progress_pct": 42,
  "from_az": "eu-west-3a",
  "to_az": "eu-west-3b",
  "checkpoint_size_mb": 890
}
```

```json
{
  "type": "migration_complete",
  "job_id": "fine-tune-llama-7b",
  "from_az": "eu-west-3a",
  "to_az": "eu-west-3b",
  "downtime_ms": 0,
  "savings_usd": 0.04,
  "epoch_resumed": "847/2000"
}
```

```json
{
  "type": "timeshift_scheduled",
  "job_id": "train-bert-custom",
  "scheduled_start": "2026-02-22T01:30:00Z",
  "estimated_end": "2026-02-22T07:30:00Z",
  "estimated_savings_usd": 30.60,
  "reason": "Prix Spot -71% entre 1h et 5h"
}
```

---

## WILLIAM — Frontend + Dashboard + Demo

### BLOC 1 : Polish Landing Page

La landing existe deja. William met a jour le contenu pour la v4.

| Tache | Detail |
|-------|--------|
| Update hero copy | "Orchestrateur FinOps Local" pas "mondial". Insister sur : zero latence, zero perte, prix /3 |
| Update "How it Works" | 3 piliers : AZ-Hopping, Time-Shifting, Smart Checkpointing |
| Update features | Refleter la v4 (plus de "mondial", ajouter checkpointing, deadline, etc) |
| CTA vers demo | Bouton "Voir la demo live" → `/demo` |
| CTA vers dashboard | Bouton "Dashboard" → `/dashboard` |

### BLOC 2 : Page Dashboard Live (`/dashboard`)

**Route : `/dashboard`**

C'est LA page qui fait gagner. Le jury doit voir Nerve en action.

| Composant | Detail | Data source |
|-----------|--------|-------------|
| **AZ Map / Schema** | Schema de la region Paris avec 3 AZ (A, B, C). Chaque AZ a un badge de couleur (vert = pas cher, rouge = cher). Lignes animees quand un job migre d'une AZ a l'autre. | `GET /api/azs` + WebSocket |
| **Stats Cards (top)** | 4 cards animees : $ economises, Interruptions gerees, CO2 evite (kg), Jobs time-shifted | `GET /api/dashboard/stats` |
| **Prix Chart** | Graphique temps reel (recharts) : prix Spot GPU sur les 3 AZ superposees. Ligne horizontale = prix On-Demand de reference. | WebSocket |
| **Checkpoint Timeline** | Quand un checkpoint se produit : timeline animee montrant save → evacuation → reprise (le scenario T+0 → T+65s) | WebSocket checkpoint_event |
| **Activity Feed** | Log en temps reel : migrations, checkpoints, time-shifts, alertes | WebSocket |
| **Scoring Sliders** | 3 sliders : poids Prix / Eco / Load. Quand on bouge, les scores AZ changent en live | `POST /api/simulate` |
| **Time-Shift Planner** | Mini-panel : prix prevu sur 24h avec le creneau optimal surligne en vert | `POST /api/timeshifting/plan` |

**Libs :**
- `recharts` (installe) — graphiques prix
- `framer-motion` (installe) — animations
- Pas besoin de world map (on est intra-region). Un **schema/diagramme des 3 AZ** avec des nodes et des lignes est plus pertinent et plus facile a coder.

### BLOC 3 : Page Demo Killer (`/demo`)

**Route : `/demo`**

Le jury clique et voit Nerve en action. C'est un wizard interactif.

| Etape | Ce que le user voit |
|-------|-------------------|
| **Step 1 : Choix du job** | Cards : "Fine-tune LLM (7B params)", "Rendu 3D (Animation)", "ETL Data Pipeline", "Inference Batch" |
| **Step 2 : Config** | Deadline picker ("J'en ai besoin pour..."), slider urgence, toggle eco-mode, choix GPU (g4dn / p3) |
| **Step 3 : Nerve decide** | Animation : Nerve scanne les 3 AZ, les prix apparaissent, les scores se calculent. AZ gagnante s'allume en vert. Si Time-Shift active : un graphique 24h apparait avec le creneau optimal. |
| **Step 4 : Simulation interruption** | Le bouton "Simuler une coupure AWS". Quand on clique : animation du Smart Checkpointing en temps reel (save → evacuation → reprise). Timeline avec countdown. C'est le moment WOW. |
| **Step 5 : Resultat** | Card finale : AZ choisie, prix/h, economie vs On-Demand, CO2 evite, temps de checkpointing, epoch reprise |

### BLOC 4 : Integration WebSocket

```typescript
// hooks/useNerveFeed.ts
const useNerveFeed = () => {
  const [priceUpdates, setPriceUpdates] = useState([])
  const [checkpointEvents, setCheckpointEvents] = useState([])
  const [migrations, setMigrations] = useState([])
  const [timeshifts, setTimeshifts] = useState([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/feed')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'az_price_update': // update prix
        case 'checkpoint_event': // animation checkpoint
        case 'migration_complete': // migration reussie
        case 'timeshift_scheduled': // job planifie
      }
    }
    return () => ws.close()
  }, [])

  return { priceUpdates, checkpointEvents, migrations, timeshifts }
}
```

### BLOC 5 : Animations & Polish

| Element | Detail |
|---------|--------|
| **AZ Schema** | 3 "nodes" (cercles) avec des lignes entre eux. Un job (point anime) se deplace d'un node a l'autre quand migration |
| **Checkpoint animation** | Progress bar "Saving checkpoint... 42%" puis "Evacuating..." puis "Resuming on AZ-B" avec des checks verts |
| **Prix live** | Nombres qui bougent en temps reel (counter animation) |
| **Time-shift graph** | Courbe 24h avec le creneau optimal qui "pulse" en vert |
| **Toast notifications** | Sonner (installe) : toast a chaque event (migration, checkpoint, alert) |
| **Dark mode** | Deja setup, s'assurer que tout est coherent |

---

## STRUCTURE DES FICHIERS (A CREER)

```
Wattless-repo/
├── vision/
│   ├── NERVE_Master_Blueprint.txt     ✅ (v4.0 — a jour)
│   └── TASK_SPLIT.md                  ✅ (ce fichier)
│
├── backend/                           🔴 NICOLAS
│   ├── main.py                        # FastAPI : routes + CORS + WebSocket
│   ├── requirements.txt               # fastapi, uvicorn, websockets, httpx, etc
│   ├── engine/
│   │   ├── __init__.py
│   │   ├── scraper.py                 # Fetch : Electricity Maps, OpenWeather
│   │   ├── scoring.py                 # Algo de score par AZ
│   │   ├── checkpointing.py           # Simulateur Smart Checkpoint
│   │   ├── timeshifter.py             # Moteur Time-Shifting (deadline → creneau)
│   │   └── data/
│   │       ├── az_config.json         # Config des 3 AZ Paris
│   │       ├── gpu_instances.json     # Types GPU + prix de reference On-Demand
│   │       └── price_curves.json      # Courbes de prix simules sur 24h
│   └── ws/
│       └── feed.py                    # WebSocket : push events
│
├── src/                               🔵 WILLIAM
│   ├── pages/
│   │   ├── Index.tsx                  ✅ (polish contenu v4)
│   │   ├── Dashboard.tsx              🔵 (a creer)
│   │   ├── Demo.tsx                   🔵 (a creer)
│   │   └── NotFound.tsx               ✅
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AZSchema.tsx           🔵 Schema 3 AZ avec animations
│   │   │   ├── StatsCards.tsx         🔵 4 metriques animees
│   │   │   ├── PriceChart.tsx         🔵 Graphique prix 3 AZ en temps reel
│   │   │   ├── CheckpointTimeline.tsx 🔵 Animation du Smart Checkpoint
│   │   │   ├── ActivityFeed.tsx       🔵 Log temps reel
│   │   │   ├── ScoringSliders.tsx     🔵 Sliders poids algo
│   │   │   └── TimeShiftPlanner.tsx   🔵 Graphique 24h + creneau optimal
│   │   ├── demo/
│   │   │   ├── JobSelector.tsx        🔵 Choix du type de job
│   │   │   ├── JobConfig.tsx          🔵 Deadline, urgence, eco-mode
│   │   │   ├── NerveDecision.tsx      🔵 Animation de decision Nerve
│   │   │   ├── InterruptionSim.tsx    🔵 Simulation coupure + checkpoint
│   │   │   └── ResultCard.tsx         🔵 Resultat final
│   │   └── shared/
│   │       └── NerveFeedProvider.tsx   🔵 Context Provider WebSocket
│   ├── hooks/
│   │   └── useNerveFeed.ts            🔵 Hook WebSocket
│   └── ...
└── ...
```

---

## PLAN D'EXECUTION (ORDRE DE DEV)

### Phase 1 : Squelettes (en parallele)

| Nicolas | William |
|---------|---------|
| Setup FastAPI + CORS + `/api/region` + `/api/azs` | Ajouter routes `/dashboard` et `/demo` dans React Router |
| Creer `az_config.json` + `gpu_instances.json` | Creer squelettes `Dashboard.tsx` et `Demo.tsx` |
| Premier endpoint qui retourne les 3 AZ avec des prix | Layout dashboard : grid avec les zones pour chaque composant |

### Phase 2 : Le Moteur (en parallele)

| Nicolas | William |
|---------|---------|
| Coder `scraper.py` : fetch Electricity Maps + OpenWeather | Coder `AZSchema.tsx` : les 3 AZ avec points colores |
| Coder `scoring.py` : algo de score par AZ | Coder `StatsCards.tsx` + `PriceChart.tsx` (fetch `/api/azs`) |
| Coder `timeshifter.py` : deadline → creneau optimal | Coder `TimeShiftPlanner.tsx` : graphique 24h |
| Endpoint `POST /api/simulate` | Coder `ScoringSliders.tsx` connecte a `/api/simulate` |

### Phase 3 : Smart Checkpointing (le WOW factor)

| Nicolas | William |
|---------|---------|
| Coder `checkpointing.py` : timeline de simulation step-by-step | Coder `CheckpointTimeline.tsx` : animation save → evacuation → reprise |
| Endpoint `POST /api/checkpoint/simulate` qui envoie les events via WS | Coder `InterruptionSim.tsx` : bouton "Simuler coupure AWS" + animation |
| Tester le flow complet : front clique → back simule → WS push → front anime | Connecter le tout |

### Phase 4 : Temps Reel (sync)

| Nicolas | William |
|---------|---------|
| Coder `/ws/feed` : push prix AZ + events toutes les 3-5s | Coder `useNerveFeed.ts` hook WebSocket |
| Inclure variations de prix realistes (fluctuations toutes les 5s) | Connecter au dashboard : prix qui bougent, AZ qui changent de couleur |
| Ajouter des events de migration auto dans le feed | `ActivityFeed.tsx` : log en temps reel |

### Phase 5 : Demo Wizard + Polish

| Nicolas | William |
|---------|---------|
| Ajouter scenarios de demo pre-faits dans l'API | Page `/demo` : wizard complet step-by-step |
| S'assurer que les endpoints repondent < 200ms | Animations smooth partout (framer-motion) |
| Preparer 2-3 scenarios de demo (LLM training, rendu 3D, batch data) | Responsive check + dark mode coherent |

---

## APIS GRATUITES A UTILISER

| API | Gratuit ? | Cle ? | Usage |
|-----|-----------|-------|-------|
| [Electricity Maps](https://api.electricitymap.org/) | Free tier | Oui (inscription) | gCO2/kWh en France temps reel |
| [OpenWeatherMap](https://openweathermap.org/api) | Free tier | Oui (inscription) | Meteo Paris (soleil/vent) |
| [Azure Retail Prices](https://prices.azure.com/api/retail/prices) | 100% public | Non | Prix GPU spot (pour reference) |
| [AWS Spot Advisor](https://spot.io/aws-spot-advisor/) | Public | Non | Frequence d'interruption par type |

---

## SCENARIOS DE DEMO A PREPARER

### Scenario 1 : "Le Fine-Tune qui esquive la coupure"
1. Job : Fine-tune LLama 7B, deadline demain 8h
2. Nerve place sur AZ-A a $0.52/h (Spot)
3. A T+45s : alerte AWS interruption
4. Smart Checkpoint : save en 6s, evacuation vers AZ-B a $0.48/h
5. Reprise a l'epoch 847/2000. Zero perte. Economie : $2.04/h vs On-Demand

### Scenario 2 : "Le Time-Shift nocturne"
1. Job : Training BERT custom, deadline dans 14h
2. Prix actuel Spot : $1.20/h (heure de pointe 19h)
3. Nerve : "Je planifie le lancement a 1h30 du matin"
4. Prix a 1h30 : $0.35/h → economie de $5.10/h sur 6h = $30.60
5. Bonus : energie 72% eolienne a 3h du mat → -8.4kg CO2

### Scenario 3 : "Le Rendu 3D sur AZ verte"
1. Job : Rendu 4K animation, pas urgent
2. Nerve compare les 3 AZ : AZ-C a le meilleur score (prix moyen mais 90% energie verte)
3. Mode eco active → Nerve choisit AZ-C malgre un prix legerement superieur
4. Dashboard montre : "3.2kg CO2 evites"

---

## TIPS HACKATHON v4

- **Le Smart Checkpointing est le WOW factor.** C'est ce qui nous differencie de tout le monde. L'animation "coupure → save → evacuation → reprise" doit etre parfaite.
- **Le Time-Shifting est le truc malin.** Montrer un graphique 24h avec "on attend la nuit" → le jury comprend immediatement la valeur.
- **Pas de world map** (on est intra-region). Un schema clean des 3 AZ avec des animations de migration est plus pertinent et plus rapide a coder.
- **Le pitch v4 :** "Les GPU coutent une fortune. Nerve transforme les serveurs instables a -90% en serveurs fiables. Si AWS coupe, on a deja sauvegarde le modele et on reprend ailleurs en 10 secondes. Zero perte, prix divise par 3."
- **Hardcode sans honte** les prix GPU et les courbes 24h. L'important c'est que le scenario de demo soit fluide et impressionnant.
