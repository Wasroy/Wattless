# Guide de connexion Supabase via MCP

## ✅ Connexion réussie !

Votre serveur MCP Supabase est correctement configuré et connecté.

### Informations du projet

- **URL du projet** : `https://trjtqbsyuxxyvyoleezu.supabase.co`
- **Clé API (anon)** : Configurée et active
- **Nombre de tables** : 50+ tables dans le schéma `public`
- **Migrations** : 200+ migrations appliquées

## 📊 Tables principales

Votre base de données contient notamment :

- **users** - 644 utilisateurs
- **items** - 19 articles
- **messages** - 165 messages
- **conversations** - 70 conversations
- **events** - 6 événements
- **notifications** - 2801 notifications
- **agora_entraide** - 29 posts
- **meetup_groups** - 6 groupes
- Et bien d'autres...

## 🛠️ Fonctions MCP disponibles

Le serveur MCP Supabase vous donne accès à de nombreuses fonctions :

### Gestion de la base de données
- `mcp_supabase_list_tables` - Lister toutes les tables
- `mcp_supabase_execute_sql` - Exécuter des requêtes SQL
- `mcp_supabase_apply_migration` - Appliquer des migrations
- `mcp_supabase_list_migrations` - Voir l'historique des migrations

### Informations du projet
- `mcp_supabase_get_project_url` - Obtenir l'URL du projet
- `mcp_supabase_get_publishable_keys` - Obtenir les clés API
- `mcp_supabase_generate_typescript_types` - Générer les types TypeScript

### Edge Functions
- `mcp_supabase_list_edge_functions` - Lister les fonctions Edge
- `mcp_supabase_get_edge_function` - Récupérer une fonction
- `mcp_supabase_deploy_edge_function` - Déployer une fonction

### Logs et monitoring
- `mcp_supabase_get_logs` - Obtenir les logs par service
- `mcp_supabase_get_advisors` - Vérifier les conseils de sécurité/performance

### Branches de développement
- `mcp_supabase_list_branches` - Lister les branches
- `mcp_supabase_create_branch` - Créer une branche
- `mcp_supabase_merge_branch` - Fusionner une branche
- `mcp_supabase_delete_branch` - Supprimer une branche

## 💡 Exemples d'utilisation

### Exécuter une requête SQL simple
```typescript
// Exemple : Récupérer tous les utilisateurs
mcp_supabase_execute_sql({
  query: "SELECT id, username, email FROM users LIMIT 10"
})
```

### Lister les tables
```typescript
mcp_supabase_list_tables({
  schemas: ["public"]
})
```

### Obtenir les logs
```typescript
mcp_supabase_get_logs({
  service: "api" // ou "postgres", "auth", "storage", etc.
})
```

### Vérifier la sécurité
```typescript
mcp_supabase_get_advisors({
  type: "security" // ou "performance"
})
```

## 🔒 Sécurité

- Les politiques RLS (Row Level Security) sont activées sur toutes les tables
- Les clés API sont sécurisées
- Les migrations sont versionnées et traçables

## 📝 Notes

- Toutes les opérations passent par le serveur MCP, ce qui garantit une connexion sécurisée
- Vous pouvez utiliser ces fonctions directement depuis Cursor/VS Code
- Les migrations doivent être appliquées via `apply_migration` pour les opérations DDL

## 🚀 Prochaines étapes

1. Explorer vos tables avec `list_tables`
2. Exécuter des requêtes avec `execute_sql`
3. Vérifier les logs avec `get_logs`
4. Générer les types TypeScript avec `generate_typescript_types`

---

**Date de connexion** : $(date)
**Statut** : ✅ Connecté et opérationnel
