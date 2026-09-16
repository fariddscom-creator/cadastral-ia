# Architecture Dashboard Vision AI + SIG Cadastre Algérien v1.0

## Aperçu système

Ce projet combine :

1. **Vision AI Agent** - Extraction de texte, icônes et repères sur images SIG croquis cadastraux
2. **Géoréférencement SIG** - Google Maps API pour géolocalisation districts Algériens  
3. **Interface Dashboard Moderne** - React/Next.js composants affichant résultats Vision AI + géoréférencement

---

## Structure API Routes

```
/api/dashboard/
├── files/          # /api/dashboard/files → liste fichiers
├── vision-batch/   # POST batch extraction croquis SIG
├── georef/         # /api/dashboard/georef → géoréférencement SIG
│   └── files/      # Liste districts avec lat/lng Google Maps
├── stats/          # GET stats d'extraction complète  
├── exports/        # POST export données extraction CSV/JSON
└── admin/          # Accès API administration extraction
```

---

## Composants Dashboard

Composants React clés : `Header`, `NavigationBar`, `FileCard`, `Landmarks`, `IconsBadge`, `GeoSummary`.

Voir [app/components/](../app/components/) pour liste complète composants.

---

## Fichiers .env nécessaire

Créer `.env` à partir `.env.example` avec :
- `GOOGLE_MAPS_API_KEY` → Votre clé API Google Maps Geocoding/Places
- `CODEX_MODEL` (optionnel)
