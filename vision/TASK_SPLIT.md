# NERVE — Hackathon Task Split

**Paris Innov Hack — Objectif : 1ere place**
**Equipe : Nicolas (Back/IA/Infra) + William (Front/Dashboard/UX)**

---

## ARCHITECTURE HACKATHON

```
                    [FRONT — William]
                    React + Vite + Tailwind + shadcn
                    Landing + Dashboard Live + Demo Wizard
                            |
                            | API REST (JSON)
                            |
                    [BACK — Nicolas]
                    Python FastAPI
                    ├── Global Intelligence Engine (scraping mondial)
                    ├── Scoring IA (algorithme de décision)
                    ├── Simulateur de migration (demo live)
                    └── WebSocket (feed temps réel → dashboard)
```

**Stack hackathon simplifiee :**
- On drop le Go pour le hackathon → tout en **Python (FastAPI)** c'est plus rapide a coder
- Le front existant (landing) reste en React/Vite/Tailwind
- Communication front↔back : **REST + WebSocket** (pour le live feed)
- DB legere : **SQLite** ou juste des **JSON en memoire** (c'est un hackathon)

---

## NICOLAS — Backend + IA + Moteur de decision

Tu geres tout ce qui tourne cote serveur. C'est le cerveau de Nerve.

### BLOC 1 : API Backend (FastAPI)

**Fichier : `backend/main.py`**

| Tache | Detail | Hardcode OK ? |
|-------|--------|---------------|
| Setup FastAPI + CORS | Serveur Python, CORS ouvert pour le front | Non |
| `GET /api/regions` | Retourne la liste de toutes les regions cloud (AWS/GCP/Azure) avec leur score en temps reel | Hardcode les regions, scrape les prix |
| `GET /api/regions/{id}/details` | Detail d'une region : prix spot, meteo, energie, events | Mix scraping + hardcode |
| `POST /api/simulate` | Le coeur : le user envoie un job (type, taille, urgence), Nerve retourne la meilleure region + economies | Algorithme reel |
| `GET /api/dashboard/stats` | Stats globales : total economise, CO2 evite, jobs migres | Peut etre semi-hardcode |
| `WebSocket /ws/feed` | Feed temps reel : push les changements de prix, migrations, alertes | Reel |

### BLOC 2 : Global Intelligence Engine (Le Radar)

C'est ce qui nous differencie de tout le monde. On scrape le monde entier.

**Fichier : `backend/engine/`**

| Source | API / Methode | Ce qu'on recupere | Hardcode ? |
|--------|--------------|-------------------|------------|
| **Prix Spot AWS** | `boto3` (AWS SDK) ou scrape AWS Spot Advisor | Prix par instance par region (us-east-1, eu-west-3, sa-east-1...) | Peut hardcode un dataset realiste si pas de creds AWS |
| **Prix GCP** | Google Cloud Billing API ou scrape | Idem GCP | Hardcode dataset |
| **Prix Azure** | Azure Retail Prices API (publique, pas besoin de creds !) | Prix spot par region | API reelle possible |
| **Meteo** | OpenWeatherMap API (gratuit) | Temperature, ensoleillement, vent par ville/region | API reelle |
| **Energie / Carbone** | Electricity Maps API (gratuit tier) | gCO2/kWh par pays en temps reel | API reelle |
| **Events sociaux** | NewsAPI ou GDELT ou hardcode | Detection Super Bowl, Black Friday, catastrophes | Hardcode une liste d'events |

**Priorite scraping reel :**
1. Electricity Maps (gratuit, impressionnant en demo)
2. OpenWeatherMap (gratuit, visuel)
3. Azure Retail Prices (gratuit, pas besoin de compte)
4. Le reste : hardcode des datasets realistes

### BLOC 3 : Algorithme de Scoring (L'IA)

**Fichier : `backend/engine/scoring.py`**

L'algorithme qui calcule le **score composite** par region :

```python
score = (
    w_price * normalize(spot_price)          # 40% — prix du serveur
  + w_green * normalize(carbon_intensity)     # 25% — intensite carbone
  + w_weather * normalize(solar_wind_score)   # 15% — meteo (soleil/vent = bonus)
  + w_load * normalize(datacenter_load)       # 10% — charge du datacenter
  + w_event * normalize(event_penalty)        # 10% — malus si evenement (Super Bowl etc)
)
# Score le plus BAS = meilleure region
```

- Les poids (`w_price`, `w_green`...) sont configurables
- On peut les changer en live dans la demo (slider sur le dashboard)
- **Pour la demo** : montrer qu'en changeant les poids (mode "Eco" vs mode "Cheap"), la region optimale change en temps reel sur la carte

### BLOC 4 : Simulateur de Migration (Demo Live)

**Fichier : `backend/engine/simulator.py`**

Le truc qui va impressionner le jury :

1. Le user choisit un type de job (Training IA, Rendu 3D, Batch Data)
2. Nerve montre en temps reel :
   - La region actuelle (cher, rouge)
   - La region optimale (pas cher, vert)
   - Les economies en $ et en CO2
   - Le temps de migration simule (ex: "2.3 secondes")
3. Animation de "migration" sur la map du front

**Hardcode OK :** Les temps de migration, la taille des jobs.
**Reel :** Le choix de la region optimale (c'est l'algo de scoring qui decide).

### BLOC 5 : WebSocket Feed

**Fichier : `backend/ws/feed.py`**

Push vers le front toutes les 3-5 secondes :
```json
{
  "type": "price_update",
  "region": "sa-east-1",
  "old_price": 0.34,
  "new_price": 0.28,
  "carbon_intensity": 42,
  "score": 0.31,
  "timestamp": "2026-02-21T19:30:00Z"
}
```

```json
{
  "type": "migration_event",
  "job_id": "train-llm-042",
  "from": "eu-west-1",
  "to": "sa-east-1",
  "reason": "Prix -47% + energie solaire abondante",
  "savings_usd": 127.50,
  "co2_saved_kg": 3.2
}
```

---

## WILLIAM — Frontend + Dashboard + UX

William gere tout ce que le jury voit. Ca doit etre beau, fluide, impressionnant.

### BLOC 1 : Refonte/Polish Landing Page

La landing existe deja (HeroSection, Features, etc). William doit :

| Tache | Detail |
|-------|--------|
| Mettre a jour le contenu | Refleter la vision V3 (mondial, pas juste intra-region) |
| Ajouter la World Map | Hero avec une carte du monde animee montrant les flux de calcul |
| CTA vers la demo | Bouton "Voir la demo live" qui redirige vers `/demo` |
| Responsive check | S'assurer que tout est clean mobile |

### BLOC 2 : Page Dashboard Live (`/dashboard`)

C'est LA page qui fait gagner le hackathon. Le jury doit voir Nerve en action.

**Route : `/dashboard`**

| Composant | Detail | Data source |
|-----------|--------|-------------|
| **World Map interactive** | Carte du monde avec les regions cloud. Points colores (vert = bon score, rouge = cher). Lignes animees quand un job migre. | `GET /api/regions` + WebSocket |
| **Score Panel** | Panel lateral : liste des regions classees par score. Mise a jour en temps reel. | WebSocket feed |
| **Stats Cards (top)** | 4 cards : Total economise ($), CO2 evite (kg), Jobs migres, Uptime (%) | `GET /api/dashboard/stats` |
| **Price Chart** | Graphique temps reel (recharts) des prix spot sur 3-4 regions | WebSocket feed |
| **Activity Feed** | Log des migrations en temps reel ("Job train-llm-042 migre de Paris vers Sao Paulo — $127 economises") | WebSocket feed |
| **Sliders de poids** | Sliders pour changer les poids de l'algo (prix, eco, load) → la carte se met a jour en live | `POST /api/simulate` |

**Libs a utiliser :**
- `recharts` (deja installe) pour les graphiques
- `react-simple-maps` ou `@react-globe.gl` pour la world map
- `framer-motion` (deja installe) pour les animations
- WebSocket natif ou `socket.io-client`

### BLOC 3 : Page Demo/Simulateur (`/demo`)

C'est la page interactive pour le jury. Ils cliquent, ils voient Nerve decider.

**Route : `/demo`**

| Etape | Ce que le user voit |
|-------|-------------------|
| **Step 1** : Choix du job | Cards cliquables : "Training IA (GPU)", "Rendu 3D", "Batch Data", "Inference LLM" |
| **Step 2** : Config | Sliders : taille du job, urgence (immédiat / flexible), mode eco (on/off) |
| **Step 3** : Nerve decide | Animation : la carte s'anime, les regions s'allument, Nerve "scanne" le monde, puis highlight la region gagnante avec une ligne animee |
| **Step 4** : Resultat | Card de resultat : "Region : Sao Paulo (AWS sa-east-1) — Economie : $340/jour — CO2 : -12kg — Temps de migration : 2.1s" |

### BLOC 4 : Integration WebSocket

William doit connecter le front au WebSocket backend pour le temps reel :

```typescript
// hooks/useNerveFeed.ts
const ws = new WebSocket('ws://localhost:8000/ws/feed')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Update state → re-render dashboard
}
```

### BLOC 5 : Polish & Animations

| Element | Detail |
|---------|--------|
| Transitions de page | Framer Motion page transitions |
| Carte du monde | Lignes animees entre regions (style "flight tracker") |
| Score update | Nombre qui s'incremente en live (counter animation) |
| Migration event | Toast notification a chaque migration |
| Dark mode | Deja setup (next-themes), s'assurer que tout est coherent |
| Favicon + OG | Branding Nerve propre |

---

## STRUCTURE DES FICHIERS (A CREER)

```
Wattless-repo/
├── vision/
│   ├── NERVE_Master_Blueprint.txt     ✅ (existe)
│   └── TASK_SPLIT.md                  ✅ (ce fichier)
│
├── backend/                           🔴 Nicolas
│   ├── main.py                        # FastAPI entry point
│   ├── requirements.txt               # deps Python
│   ├── engine/
│   │   ├── __init__.py
│   │   ├── scraper.py                 # Scraping APIs (prix, meteo, energie)
│   │   ├── scoring.py                 # Algorithme de scoring
│   │   ├── simulator.py               # Simulateur de migration
│   │   └── data/
│   │       ├── regions.json           # Dataset regions cloud (hardcode)
│   │       └── events.json            # Dataset events sociaux (hardcode)
│   └── ws/
│       └── feed.py                    # WebSocket handler
│
├── src/                               🔵 William
│   ├── pages/
│   │   ├── Index.tsx                  ✅ (existe, a polish)
│   │   ├── Dashboard.tsx              🔵 (a creer)
│   │   ├── Demo.tsx                   🔵 (a creer)
│   │   └── NotFound.tsx               ✅ (existe)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── WorldMap.tsx           🔵 World map interactive
│   │   │   ├── ScorePanel.tsx         🔵 Classement regions
│   │   │   ├── StatsCards.tsx         🔵 Cards metriques
│   │   │   ├── PriceChart.tsx         🔵 Graphique prix temps reel
│   │   │   └── ActivityFeed.tsx       🔵 Log migrations
│   │   ├── demo/
│   │   │   ├── JobSelector.tsx        🔵 Choix du type de job
│   │   │   ├── ConfigSliders.tsx      🔵 Config du job
│   │   │   ├── NerveAnimation.tsx     🔵 Animation de decision
│   │   │   └── ResultCard.tsx         🔵 Resultat final
│   │   └── shared/
│   │       └── NerveFeedProvider.tsx   🔵 Context WebSocket
│   ├── hooks/
│   │   └── useNerveFeed.ts            🔵 Hook WebSocket
│   └── ...
│
├── package.json                       ✅ (existe)
├── index.html                         ✅ (existe)
└── ...
```

---

## PLAN D'EXECUTION (ORDRE DE DEV)

### Phase 1 : Squelette (les 2 en parallele)

| Nicolas | William |
|---------|---------|
| Setup FastAPI + CORS + route `/api/regions` | Setup routing : ajouter `/dashboard` et `/demo` dans React Router |
| Creer `regions.json` avec 15-20 regions cloud reelles (coords GPS, provider, zone) | Creer le squelette de `Dashboard.tsx` et `Demo.tsx` (layout vide) |
| Premier endpoint qui retourne les regions | Installer `react-simple-maps` ou lib de map |

### Phase 2 : Le Moteur (en parallele)

| Nicolas | William |
|---------|---------|
| Coder le scraper : Electricity Maps API + OpenWeatherMap | Coder la WorldMap : afficher les regions sur la carte avec des points colores |
| Coder `scoring.py` : algorithme de score composite | Coder les StatsCards + ScorePanel qui fetch `/api/regions` |
| Endpoint `POST /api/simulate` | Coder le PriceChart avec recharts |

### Phase 3 : Le Temps Reel (sync necessaire)

| Nicolas | William |
|---------|---------|
| Coder le WebSocket `/ws/feed` qui push des updates toutes les 3-5s | Coder `useNerveFeed.ts` hook WebSocket |
| Le feed inclut : price updates + migration events | Connecter le feed au dashboard : map qui bouge, scores qui changent, activity feed |

### Phase 4 : La Demo Killer

| Nicolas | William |
|---------|---------|
| Coder `POST /api/simulate` complet : prend un job, retourne la meilleure region avec animation data | Coder la page `/demo` : wizard step-by-step |
| Ajouter des scenarios de demo pré-faits (toggle dans l'API) | Animation Nerve qui "scanne" le monde et choisit |
| S'assurer que le scoring change en live si on bouge les sliders | Sliders connectes a l'API, carte qui reagit |

### Phase 5 : Polish (les 2)

| Nicolas | William |
|---------|---------|
| Ajouter des events hardcodes realistes (Super Bowl, canicule Europe, etc) | Animations smooth partout |
| Logger les migrations pour l'activity feed | Responsive |
| Stress test : le WS ne doit pas lag | Branding final, favicon, OG |

---

## APIS GRATUITES A UTILISER

| API | Gratuit ? | Cle necessaire ? | Usage |
|-----|-----------|-------------------|-------|
| [Electricity Maps](https://api.electricitymap.org/) | Oui (free tier) | Oui (inscription) | Intensite carbone par pays |
| [OpenWeatherMap](https://openweathermap.org/api) | Oui (free tier) | Oui (inscription) | Meteo par ville |
| [Azure Retail Prices](https://prices.azure.com/api/retail/prices) | Oui, 100% public | Non | Prix Azure spot |
| [NewsAPI](https://newsapi.org/) | Oui (dev) | Oui | Events sociaux |
| [GDELT](https://api.gdeltproject.org/) | Oui, 100% public | Non | Events mondiaux |

---

## TIPS HACKATHON

- **La demo > le code.** Le jury ne lira pas ton code. Il verra la demo.
- **La carte du monde animee** c'est ce qui fait "wow". Investir du temps la-dessus.
- **Hardcode sans honte** les donnees quand c'est pas critique. L'important c'est que ca marche en demo.
- **Le pitch :** "On scrape le monde entier — prix, meteo, evenements — pour envoyer votre calcul la ou c'est le moins cher et le plus vert. En temps reel."
- **Avoir 2-3 scenarios de demo prets** : "Regardez, il fait nuit en Europe, le solaire au Bresil est a fond → Nerve migre le calcul la-bas et economise $340/jour"
