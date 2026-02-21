# Guide de Déploiement - NERVE Engine Edge Functions

## ✅ Migration Complète

Toutes les Edge Functions ont été créées et sont prêtes à être déployées.

## Structure Créée

```
supabase/
  functions/
    _shared/
      types.ts          ✅ Types TypeScript complets
      utils.ts          ✅ Utilitaires et constantes
    scrape-gpu-prices/  ✅ Scrape Azure Retail Prices
    scrape-weather/     ✅ Scrape Open-Meteo
    scrape-carbon/      ✅ Scrape Carbon Intensity
    get-region-data/    ✅ Combine tous les scrapers
    simulate/           ✅ Simulation complète avec scoring
    timeshift-plan/     ✅ Calcul créneau optimal
    checkpoint-simulate/✅ Simulation interruption
    dashboard-stats/    ✅ Statistiques dashboard
    ws-feed/            ✅ WebSocket feed
  migrations/
    001_create_nerve_tables.sql ✅ Tables stats + cache
```

## Déploiement

### 1. Installer Supabase CLI

```bash
npm install -g supabase
```

### 2. Se connecter au projet

```bash
supabase login
supabase link --project-ref zomtudzqlwyewfhczrkp
```

### 3. Appliquer la migration SQL

```bash
supabase db push
```

Ou via le dashboard Supabase : copier-coller le contenu de `supabase/migrations/001_create_nerve_tables.sql`

### 4. Déployer les Edge Functions

```bash
cd supabase/functions

# Déployer chaque fonction
supabase functions deploy scrape-gpu-prices
supabase functions deploy scrape-weather
supabase functions deploy scrape-carbon
supabase functions deploy get-region-data
supabase functions deploy simulate
supabase functions deploy timeshift-plan
supabase functions deploy checkpoint-simulate
supabase functions deploy dashboard-stats
supabase functions deploy ws-feed
```

## URLs des Endpoints

Une fois déployées, les fonctions seront accessibles via :

- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/scrape-gpu-prices`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/scrape-weather`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/scrape-carbon`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/get-region-data`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/simulate`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/timeshift-plan`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/checkpoint-simulate`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/dashboard-stats`
- `https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/ws-feed`

## Tests

### Test 1: Scrape GPU Prices

```bash
curl -X POST https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/scrape-gpu-prices \
  -H "Content-Type: application/json" \
  -d '{"region_id": "francecentral"}'
```

### Test 2: Get Region Data

```bash
curl -X POST https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/get-region-data \
  -H "Content-Type: application/json" \
  -d '{"region_id": "francecentral"}'
```

### Test 3: Simulate

```bash
curl -X POST https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "estimated_gpu_hours": 24,
    "min_gpu_memory_gb": 16,
    "deadline": "2025-02-23T12:00:00Z"
  }'
```

### Test 4: Dashboard Stats

```bash
curl -X GET https://zomtudzqlwyewfhczrkp.supabase.co/functions/v1/dashboard-stats
```

## Notes Importantes

1. **Imports relatifs** : Les fonctions utilisent des imports relatifs vers `_shared/`. Si Supabase ne les supporte pas, il faudra consolider les dépendances dans chaque fonction.

2. **Variables d'environnement** : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

3. **CORS** : Toutes les fonctions incluent les headers CORS pour permettre les appels depuis le frontend.

4. **Migration SQL** : La fonction `update_nerve_stats` est créée dans la migration et utilisée par `simulate` et `checkpoint-simulate`.

## Prochaines Étapes

1. Déployer toutes les fonctions
2. Tester chaque endpoint
3. Mettre à jour le frontend pour utiliser les nouveaux endpoints Supabase
4. Supprimer le dossier `backend/` une fois tout validé

## Compatibilité Frontend

Les endpoints retournent les mêmes formats JSON que le backend Python, donc le frontend devrait fonctionner sans modification majeure. Il suffit de changer les URLs des API.
