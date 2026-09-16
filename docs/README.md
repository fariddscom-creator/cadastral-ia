# Dashboard Vision AI + SIG Cadastre Algérien v1.0

**Vue d'ensemble du dossier docs - Documentation complète extraction Vision IA et géoréférencement districts SIG**

---

## Table des matières

- [Architecture](#architecture)
- [Installation](#installation) 
- [API Endpoints](#api-endpoints)
- [Exemples](#exemples)

---

## Architecture

```
/dashboard
├── index.tsx       # Composant principal dashboard
├── _api.md         # Documentation API complète
└── page.tsx        # Page principale cadastre SIG
```

### Composants clés :
- **Header** - En-tête dashboard Vision AI v1.0
- **NavigationBar** - Navigation routes (Vue d'ensemble, Géoréférencement, Vision IA)
- **FileCard** - Affichage district avec données extraction complète
- **Landmarks** - Repères SIG (stade, mosquée, mairie...)
- **IconsBadge** - Icônes types (mosquée 🕌, école 🏫, administration 🏛️)
- **GeoSummary** - Résumé géoréférencement lat/lng + Google Maps

---

## Installation

```bash
npm install
cp .env.example .env  # Ajouter API KEY Google Maps
npm run dev           # Lancement mode développement port 3492
```

---

## API Endpoints

Voir : `app/dashboard/_api.md` ou `API.md` pour liste complète.

### GET /api/dashboard/files
Récupère listing districts avec statut extraction Vision AI.

---

## Exemples d'utilisation

### Visualisation dashboard :
```bash
npm run dev  # http://localhost:3492
```

### Appel API batch extraction :
```bash
curl -X POST http://localhost:3492/api/dashboard/vision-batch \
  -H "Content-Type: application/json" \
  -d '{"files": ["16.08.05.png", "16.09.27.png"]}'
```

Voir `README.md` et `API.md` pour utilisation complète !
