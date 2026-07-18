# Session du 18 juillet 2026

## Ce qui a été fait

### Pool standings & qualifications
- `computeStandings` : classement par poule (victoires > points marqués > goal-average)
- `computeQualifications` : classement global cross-poules, attribue `principale` / `consolante` / `éliminée` selon `nbQualified`
- API `GET /api/contests/[id]/standings`
- Vue admin : tableau classement dans chaque poule (AdminPools.svelte)
- Vue publique : `/contest/[id]/standings`
- Vue équipe : quand toutes les poules sont terminées, affiche rang + badge de qualification

### Transition poules → finales
- API `POST /api/contests/[id]/start-finals` : valide que tous les matchs sont terminés, passe en `finals`
- Admin : bouton "Lancer les finales" + option auto-transition (checkbox)
- Compteur de matchs terminés toujours visible

### Super admin (`/admin`)
- Login par mot de passe (`APP_ADMIN_PASSWORD` env var)
- Token de session hashé en mémoire (jamais le mot de passe en localStorage)
- Anti-bruteforce : 5 tentatives / 15 min par IP, logs des échecs
- Liste des concours (nom, statut, nb équipes, date)
- Suppression d'un concours (cascade complète)
- Nettoyage auto : supprime les concours inactifs > N jours (`APP_CLEANUP_DAYS`)
- Cleanup périodique au démarrage du serveur (`hooks.server.ts`)

### Logger (`src/lib/server/logger.ts`)
- `createLogger('tag')` → `.debug()`, `.info()`, `.warn()`, `.error()`
- Filtrage par niveau via `LOG_LEVEL` env var
- Logs ajoutés : auth, contest lifecycle, team join, cleanup, admin force score

### Kiosk mode
- Schema : table `kioskTokens`
- Admin génère un lien d'activation → ouvre sur l'appareil partagé → stocke le token en localStorage
- Page kiosk (`/contest/[id]/kiosk`) :
  - Login par nom d'équipe (autocomplete) + PIN (mode password, Lucide Eye toggle)
  - Inscription directe pendant la phase registration
  - Vue équipe complète (réutilise TeamWaiting / TeamPoolMatch)
  - Déconnexion + auto-logout après 2 min d'inactivité
  - Pas de menu contextuel (détecté via URL dans le layout)
  - Adaptatif : le bouton inscription disparaît quand le concours passe en poules
- API : `POST /api/contests/[id]/kiosk-token`, `GET .../kiosk-token?token=`, `POST .../kiosk-login`
- Page d'activation : `/contest/[id]/kiosk/activate?token=xxx`

### Nettoyage localStorage
- Page d'accueil : vérifie que chaque concours stocké existe encore, supprime les tokens obsolètes

### Visual identity — Earthy/Green theme
- Palette de couleurs via `@theme` dans layout.css (vert forêt primary, brun accent)
- Fond warm off-white, cartes blanches à bordure verte douce
- Boutons : primary vert, secondary warm, danger rouge-brun
- Header/footer : fond blanc, titre en couleur primary
- Scroll-to-top button avec animation slide-up
- Tous les textes muted harmonisés
- Lucide icons partout : Menu, RefreshCw, RotateCcw, ArrowUp, Eye, EyeOff
- Suppression de l'eye natif Edge (`input::-ms-reveal`)

## Prochaines étapes

1. **Elimination brackets** — la principale feature restante :
   - Data model (bracket matches, rounds)
   - Génération du tableau depuis le classement des poules
   - Principale (top N) + Consolante (16 suivants) + Challenges (optionnel)
   - Flow de match single-elimination
   - Vues admin + team + publique

2. **Déploiement Vercel** — adapter pour Postgres, configurer les env vars - DONE

3. **Kiosk polish** — tester le flow complet sur mobile, ajuster l'UX
