# API Dashboard Vision AI + SIG Cadastre v1.0

## Endpoints disponibles :

### 1. GET /api/dashboard/files
Récupération listing fichiers districts avec extraction Vision AI + géoréférencement SIG.

**Params :**
- `page`: number - Numéro de page (default: 0)
- `limit`: string - Nombre d'éléments par page (default: 10)

### 2. POST /api/dashboard/vision-batch
Lancement d'extractions Vision AI sur batch fichiers croquis SIG.

**Payload :**
```json
{ "files": ["16.08.05.png", "16.09.27.png"] }
```

### 3. GET /api/dashboard/stats
Statistiques extraction + géoréférencement SIG complet :
- `total` - Fichiers traités
- `done` - Extraction terminée  
- `running` - En cours de traitement
- `failed` - Échoué traitements

### 4. GET /api/dashboard/georef/files
Liste districts géoréférencés avec lat/lng calculés par Google Maps API.

### 5. GET /api/dashboard/export-data
Export données extraction Vision AI vers CSV/JSON/TIGER pour traitement SIG CADST.
