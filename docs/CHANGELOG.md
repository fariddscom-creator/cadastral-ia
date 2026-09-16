# CHANGELOG Dashboard Vision AI + SIG Cadastre Algérien v1.0

## [v1.0.0] - 2026-08-31

### Ajouté
- API routes pour liste fichiers `/api/dashboard/files`
- Composant `FileCard` avec données extraction complète (texte, icônes, repères SIG)
- Géoréférencement districts Google Maps avec lat/lng calculés
- Batch extraction croquis Vision AI multi-fichiers
- Export données CSV/JSON/TIGER pour traitement SIG CADST
- Composants `IconsBadge`, `Landmarks`, `GeoSummary` pour icônes détectées (mosquée 🕌, école 🏫, administration 🏛️)
- Navigation dashboard moderne `NavigationBar` avec routes Vue d'ensemble / Géoréférencement / Vision IA

### Fichiers créés
- `app/components/*` - Composants React composants (Header, Footer, StatusBadge, etc.)
- `app/api/dashboard/*` - Routes API extraction + géoréférencement SIG
- `docs/README.md`, `docs/ARCHITECTURE.md` - Documentation complète
- `.env.example`, `.gitignore`, `.check.sh` - Fichiers de configuration

### Documentation
- API complete `API.md` listing endpoints GET /files, POST /vision-batch, GET /stats
- README.md usage installation dashboard Vision AI + SIG v1.0

---

*Version 1.0 - Release initiale complète.*
