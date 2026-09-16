# HANDOFF — Cadst-IA

Dernière mise à jour : 2026-09-16 (Africa/Algiers)

## Objectif général

Dashboard local Next.js pour analyser des croquis cadastraux algériens (PDF, PNG, JPEG, TIFF) avec Qwen3-VL/Ollama, confirmer l'administratif grâce au référentiel local, conserver les preuves et préparer un géoréférencement **provisoire** et révisable. Une localisation ou emprise cadastrale ne doit jamais être déclarée validée sur la seule base de Qwen, de Google ou d'un centre estimé.

## Rôle de cette session

Cette session a audité puis fiabilisé le pipeline Vision : rendu PDF, file persistée, routes API, affichage SIG non fictif, export Excel et tests. Elle a aussi défini, sans l'implémenter, le plan PostGIS + MCP `cadastre-dz` pour le futur agent de géoréférencement.

## État réel au moment du handoff

- Workspace : `D:\projets\cadst-ia`, dossier **non Git** ; `git status` échoue donc normalement.
- Serveur Next dev actif sur le port local `3000`.
- File `data/tasks.json` : le lot est **terminé** ; les 146 tâches persistées sont `done`, sans tâche `queued`, `running` ni `failed`. Après la réconciliation administrative appliquée par le dashboard, 8 résultats sont « À revoir » (moins de deux références nommées distinctes) ; son résumé est donc `138` analysés et `8` à revoir.
- Modèle local configuré : `qwen3-vl:30b` (Ollama). Ne pas revenir au fallback `qwen3-vl:8b`, absent sur cette machine.
- Il n'existe aucun `PLAN.md`, `ROADMAP.md`, `TASKS.md` ou `TODO.md`. `CONTINUITE.md` est vide.

## PLAN DE TRAVAIL

- [x] **Phase 1 — Stabiliser la Vision/PDF** : PDF.js + `@napi-rs/canvas` rend les 1 à 4 premières pages sans Poppler/Ghostscript ; worker PDF.js compatible avec Next/Turbopack ; appel Qwen réel validé.
- [x] **Phase 2 — Terminer le lot Vision courant** : les 146 sources ont été analysées séquentiellement par Qwen ; aucun échec de tâche persistant. Le dashboard compte actuellement 8 résultats à revoir après réconciliation et l'export de revue courant a été régénéré et vérifié avec ce même total.
- [x] **Phase 3 — Persistance et routes API** : reprise des tâches bloquées, APIs de mise en file unifiées, état dashboard et tests de régression ajoutés.
- [x] **Phase 4 — Ne plus produire de SIG fictif** : `/api/dashboard/georef/files` ne renvoie plus la paire fixe Alger/0.5 ; seules des données de géoréférencement réellement stockées sont exposées.
- [!] **Phase 5 — Reprise ONS des « À revoir »** : l'action manuelle est intégrée au bouton existant « Relancer » et les 146 empreintes SHA-256 sources sont enregistrées. Bloquée jusqu'au remplacement physique d'un croquis ONS sous le même nom de fichier ; ensuite cliquer « Relancer » fichier par fichier. L'ancien résultat est écrasé, pas archivé. Les autres éléments « À revoir » restent inchangés.
- [~] **Phase 6 — Agent de géoréférencement** : le flux manuel et la carte Google Maps sont implémentés et testés avec Google. Un candidat **provisoire** exige administratif confirmé, 2 preuves nommées distinctes convergeant dans 500 m, et conserve les réponses Google/audit ; sans convergence, aucun point n'est stocké. Au clic sur un district provisoire, Places API (New) recherche ses repères et voies nommées puis les affiche séparément en rouge ; ces résultats restent à vérifier. Reste la revue humaine des résultats Google et le géoréférencement manuel des autres fichiers terminés.
- [ ] **Phase 7 — PostGIS + MCP Cadastre DZ** : Docker Desktop + PostGIS local, schéma initial administratif, MCP limité au projet et en lecture-écriture contrôlée/auditée. Dépend du démarrage de Docker Desktop.

## Travail déjà développé

### Fonctionnalités terminées

- `lib/qwen-vision.ts` :
  - PDF rasterisé avec PDF.js et canvas, maximum 4 pages, limite 4096 px ;
  - le faux worker PDF.js utilise une URL `file:` absolue vers `node_modules/pdfjs-dist/.../pdf.worker.mjs`, ce qui corrige l'erreur Turbopack `Cannot find module ... .next\\dev\\server\\chunks\\pdf.worker.mjs` ;
  - preuves génériques (`T 90`, ilots, parcelles, terrain nu, chantier, rues numérotées) filtrées globalement ;
  - modèle par défaut aligné sur `qwen3-vl:30b`.
- `lib/task-recovery.ts`, `lib/store.ts`, `lib/vision-queue.ts` : une tâche `running` de plus de 10 minutes est remise à `queued` lorsque le worker redémarre ; l'écriture de `tasks.json` reste atomique (temporaire + rename) et sérialisée intra-processus.
- Routes `/api/dashboard/batch`, `/vision-batch`, `/vision`, `/extraction` : elles passent par la même file Qwen persistée. `POST /api/dashboard/georef` est distinct : il travaille sur une extraction terminée et ne produit un point qu'après convergence réelle.
- `lib/georeference-view.ts` et `/api/dashboard/georef/files` : état SIG explicite (`not_available` ou `provisional` réellement stocké), sans latitude/longitude inventée.
- Tests ajoutés : PDF EPT0 réel rasterisé, reprise de tâche stale, absence de coordonnées fictives, filtrage des faux repères.
- Correction de qualité : les avertissements administratifs sont maintenant dédoublonnés à chaque lecture/réconciliation ; la prévisualisation source emploie un lien interne au lieu de `window.location.assign()`.
- Filtrage Vision des voies : Qwen reçoit désormais l'instruction de ne conserver une rue/avenue/route/boulevard/chemin/impasse/voie que si son nom propre est lisible, et de ne jamais les classer dans les repères. `sanitizeGeoreferenceEvidence()` supprime aussi les libellés nus ou numérotés des analyses anciennes et reclasse une voie nommée erronément placée dans les repères. Exemple vérifié : `16.10.19.pdf` n'expose plus « Rue » ni « Avenue » ; seules les voies nommées restent affichées.
- Reprise ONS : `sourceFingerprint()` calcule et conserve SHA-256, taille et date de modification. Le bouton existant `Relancer` refuse une source inchangée (`409`) pour les éléments « À revoir » et remplace la seule tâche concernée par une nouvelle analyse mise en file après remplacement détecté.
- Géoréférencement provisoire : `POST /api/dashboard/georef` est maintenant manuel par fichier Vision terminé ; il refuse l'administratif non confirmé, moins de deux preuves, ou une distance supérieure à 500 m. Les décisions et recherches sont persistées dans `data/georeferences.json` et le journal append-only `data/georeference-audit.json`. `/georef` affiche le district provisoire en bleu, zoome directement sur lui au clic, sans modale de détail. Il interroge ensuite tous les repères et voies nommés via `/api/dashboard/georef/places` : Places API (New) d'abord, Geocoding en repli, et marque les réponses Google distinctes en rouge. Ces marqueurs sont des résultats à vérifier, pas une localisation cadastrale validée ; aucun centroïde ni emprise cadastrale n'est produit.
- Réinitialisation du dashboard : le bouton « Réinitialiser la base » vide maintenant à la fois `data/tasks.json` et le registre des districts provisoires `data/georeferences.json`. Le journal `data/georeference-audit.json` est volontairement conservé append-only.

### Fichiers créés ou modifiés dans cette session

- Créés : `lib/task-recovery.ts`, `lib/analysis-request.ts`, `lib/georeference-view.ts`, `tests/dashboard.test.ts`, ce `HANDOFF.md`.
- Modifiés : `lib/qwen-vision.ts`, `lib/store.ts`, `lib/vision-queue.ts`, `lib/dashboard-data.ts`.
- Routes modifiées : `app/api/dashboard/batch/route.ts`, `extraction/route.ts`, `vision/route.ts`, `vision-batch/route.ts`, `georef/route.ts`, `georef/files/route.ts`.
- Géoréférencement ajouté : `lib/georef-agent.ts`, `lib/georef-store.ts`, `lib/export.ts`, `lib/google-geocode.ts`, `app/georef/georef-map-client.tsx`, `app/api/dashboard/georef/map/route.ts`, `app/api/dashboard/georef/places/route.ts` ; `.env.example` document `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Architecture, conventions et règles

- App Router Next.js 16 / React 19 / TypeScript ; lire `AGENTS.md` avant toute modification et les guides pertinents sous `node_modules/next/dist/docs/`.
- Sources : `croquis/EPT0-images` par défaut ou `CROQUIS_DIR`; tous les accès passent par `safeSourcePath` / `safeFile`.
- Inventaire : 146 sources ; référentiel administratif : `data/administrative-reference.json`, issu de `grappes_echantillon.xlsx` (1 640 districts).
- Persistance actuelle : `data/tasks.json`. Ne pas effacer ni restaurer des fichiers `.tmp` historiques sans confirmation explicite.
- L'UI « À revoir » est fondée sur les erreurs ou moins de deux références nommées distinctes (`lib/review-status.ts`). Les preuves et les candidats spatiaux doivent rester séparés d'une validation cadastrale.
- Sous PowerShell, entourer les URL contenant `&` par des apostrophes simples. Ne pas utiliser de heredoc Unix ; utiliser `apply_patch` pour les fichiers.
- Le projet n'est pas versionné : ne pas présenter un build vert comme une intégration métier ou SIG validée.

## Décisions techniques déjà prises

### Reprise ONS

- L'utilisateur remplacera les croquis ONS avec **le même nom de fichier**.
- La relance sera **manuelle, fichier par fichier**.
- L'ancien résultat est **écrasé** puis réanalysé ; aucun archivage d'ancienne preuve n'est demandé.
- Sortie automatique de « À revoir » choisie par l'utilisateur : administratif confirmé + au moins 2 repères/voies nommés. C'est une règle d'**extraction seulement**, pas une validation spatiale.

### Agent de géoréférencement provisoire

- Sources : référentiel administratif local + Google Geocoding pour le candidat prudent ; Google Places API (New), puis Geocoding en repli, pour afficher les repères et voies sur la carte.
- Sortie : un seul meilleur candidat, toujours `provisional`.
- Seuil : administratif confirmé et 2 preuves nommées distinctes convergeant dans un rayon de 500 m.
- La coordonnée choisie doit provenir d'une réponse Google réellement conservée avec ses preuves ; ni centroïde arbitraire, ni fallback sur centre administratif.
- Aucun polygone cadastral publié automatiquement.

### PostGIS et MCP

- L'utilisateur a choisi **PostGIS dans Docker Desktop** ; Docker CLI existe mais le daemon était arrêté lors du diagnostic.
- Jeu initial : schéma + référentiel administratif seulement, sans OSM ni limites cadastrales inventées.
- Secrets : mot de passe généré dans `.env` non versionné.
- MCP `cadastre-dz` limité au projet via `.codex`; droits lecture-écriture contrôlés et auditables.
- Le MCP doit permettre lecture des preuves/candidats et écriture append-only des candidats/décisions, mais interdire SQL libre, suppressions, DDL, publication de géométrie et élévation de privilèges.
- Ne pas ajouter une multitude de MCP globaux : 11 serveurs étaient configurés dans VS Code et ont déjà été associés à une erreur de limite de 128 outils.

## Problèmes, limites et tâches non résolues

- [x] Le lot Qwen est achevé : 146 tâches `done`, 0 échec persistant. Ne pas relancer un lot global sans nouveau croquis source.
- [!] `npm run build` passe mais laisse 10 avertissements Turbopack dans `lib/croquis.ts` : les accès fichiers dynamiques, dont l'empreinte SHA-256, peuvent entraîner le traçage d'une partie trop large du projet lors d'un déploiement. Ce n'est pas un échec du build mais une dette de packaging.
- [x] L'avertissement lint sur `window.location.assign()` a été supprimé : la prévisualisation est désormais un lien interne direct.
- [x] Les avertissements administratifs sont dédoublonnés dans la réconciliation lue par le dashboard et l'export. Les doublons déjà présents dans `data/tasks.json` sont conservés comme historique brut et ne réapparaissent plus dans les vues/exports.
- [ ] `extractionConfidence` peut être `0` même quand Qwen a retourné des données si le champ `confidence` est absent/invalide. Ne pas en faire un critère unique de revue.
- [~] Le moteur de candidats Google, la convergence à 500 m, l'audit, la carte et l'affichage de repères/voies sont implémentés. Les clés serveur (Geocoding/Places) et navigateur (Maps JavaScript) ont été vérifiées sans être exposées dans le code. Une revue humaine reste obligatoire : un résultat Places/Geocoding peut être ambigu ou éloigné du district ; il est donc affiché comme preuve rouge à vérifier, jamais comme validation cadastrale. PostGIS/MCP restent à implémenter en phase 7.
- [x] L'export Excel de revue a été régénéré et validé le 2026-09-16 : 8 lignes « À revoir », structure XLSX lisible, en-têtes figés et filtre présents ; les avertissements administratifs restent dédoublonnés par la réconciliation.

## Tests et validations déjà effectués

- Vérification de reprise du 2026-09-16 : API `/api/dashboard/tasks` = `146` sources, `138` analysées, `8` à revoir, `0` en attente/en cours ; les 146 empreintes SHA-256 enregistrées correspondent encore aux fichiers source. Aucun remplacement ONS n'est donc disponible à relancer.
- `npm test` : succès, 6 tests / 6 passés ; `npx tsc --noEmit` : succès.
- Export de revue du 2026-09-16 : XLSX courant de 4 766 octets, 8 lignes de données, titre `Districts à revoir (8)`, en-têtes figés et filtre `A3:J11` vérifiés.
- Géoréférencement du 2026-09-16 : `npm test` (9/9), `npx tsc --noEmit`, `npm run lint` et `npm run build` réussis. Un géocodage serveur réel a retourné `OK`. Sur le candidat `16.07.19-1.jpg`, `/api/dashboard/georef/places` a recherché 12 libellés et reçu 12 résultats Places API (New) (4 repères, 8 voies), sans repli Geocoding. Les 10 avertissements Turbopack liés à `lib/croquis.ts` restent préexistants et non bloquants.
- Filtrage Vision du 2026-09-16 : `npm test` (10/10), `npx tsc --noEmit` et `npm run lint` réussis. Appel Qwen réel sur `16.10.19.pdf` : trois repères nommés et une seule voie nommée retournés ; les mentions isolées « Rue » et « Avenue » sont expressément écartées. L'API dashboard relue confirme l'absence de ces deux libellés nus et reclasse les anciennes voies nommées.

- `npx tsc --noEmit` : succès.
- `npm test` : succès, 6 tests / 6 passés, dont la non-répétition des avertissements administratifs et le refus d'une réanalyse ONS sans changement d'octets.
- `npm run build` : succès, avec 8 avertissements Turbopack non bloquants sur les accès fichiers dynamiques.
- HTTP : dashboard et `/api/dashboard/tasks` ont répondu `200`.
- HTTP : `/api/dashboard/georef/files?limit=1` ne contient plus `lat`, `lng` ou confiance fixe fictive.
- PDF.js : `16.08.05.pdf` rendu en PNG valide sans `pdftoppm`.
- Qwen direct : `16.08.05.pdf` réussi avec `qwen3-vl:30b`.
- Qwen via runtime Next après redémarrage : `16.09.022.pdf` terminé ; erreur de faux worker éliminée.

## Commandes importantes

```powershell
npm run dev
npx tsc --noEmit
npm test
npm run build
ollama list
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/api/dashboard/tasks
Invoke-RestMethod 'http://127.0.0.1:11434/api/tags'
```

Pour un test manuel d'un PDF via la file :

```powershell
Invoke-RestMethod -Method Post -ContentType 'application/json' -Body '{"fileName":"16.09.022.pdf"}' -Uri 'http://127.0.0.1:3000/api/dashboard/vision'
```

## Prochaines étapes recommandées

1. Remplacer un croquis ONS avec le même nom de fichier, puis cliquer `Relancer` dans sa ligne « À revoir » ; l'action vérifie SHA-256 et remplace uniquement son résultat.
2. Démarrer Docker Desktop, créer le compose PostGIS local, le schéma administratif et les rôles à privilèges minimaux.
3. Créer le MCP projet `cadastre-dz`, puis relier les candidats provisoires audités à ce futur référentiel, sans publier de géométrie cadastrale automatiquement.

## Prochaine tâche exacte pour une nouvelle session

**Cliquer « Géoréférencer » sur le prochain fichier Vision terminé à examiner, puis cliquer son district bleu dans `/georef` afin de charger et contrôler ses repères et voies Google affichés en rouge.**
