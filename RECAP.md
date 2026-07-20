# Récap — Brackets UI

## Ce qui a été fait

### 1. Endpoint `/api/contests/[id]/status`
- Filtre désormais uniquement les matchs de poule pour le check `allDone` (évite que les matchs de bracket interfèrent avec la détection de fin de poules).

### 2. `AdminBrackets.svelte` (nouveau composant)
- Affichage tour par tour pour les deux brackets (Principale et Consolante).
- Badges de statut et scores pour chaque match.
- Bouton **Forcer** : ouvre une modale pour écraser le score d'un match.
- Bouton **Avancer au tour suivant** : visible quand tous les matchs du tour en cours sont terminés, appelle `POST /advance-bracket?bracket=X`.
- Checkbox **auto-transition** : persistée dans `localStorage` (`autoTransition_${contestId}`), déclenche automatiquement l'avancement quand un tour se complète via SSE.
- Affichage du vainqueur quand le bracket est terminé.

### 3. Page admin (`admin/+page.svelte`)
- Ajout des phases `finals` (affiche `AdminBrackets`) et `completed` (affiche résumé + `AdminBrackets` en lecture).
- Label de statut corrigé : Inscriptions / Phase de poules / Finales / Terminé.

### 4. Page équipe (`team/+page.svelte`)
- Phase `finals` : réutilise `TeamPoolMatch` (le composant de match fonctionne de manière identique pour les matchs de bracket).
- Phase `completed` : affiche "Concours terminé" + historique des matchs joués.

### 5. Page kiosque (`kiosk/+page.svelte`)
- Même ajout que la page équipe : phases `finals` et `completed`.

### 6. Page live (`live/+page.svelte`)
- **Finals** : toggle Principale/Consolante avec rotation automatique toutes les 10s, cartes de matchs avec mise en évidence des matchs en cours, indicateurs de vainqueur par match.
- **Completed** : podium des vainqueurs des deux brackets + historique complet du bracket sélectionné.
- Correction de `getQualification` pour utiliser `contest.nbConsolante` au lieu d'un 16 codé en dur.

## Ce qu'il reste à faire

### Prioritaire
- **Tester le flow complet** : simulation Python end-to-end couvrant la phase de finales (création bracket → soumission scores → advance → completion).
- **Valider l'auto-transition** : vérifier que le SSE + checkbox déclenche bien l'avancement automatique côté admin sans double-appel.

### Améliorations possibles
- **Affichage arbre de bracket** : actuellement les matchs sont en liste par tour ; un affichage en arbre visuel (style tableau croisé) serait plus lisible pour les grands brackets.
- **Position finale de l'équipe** : dans la page team/kiosk `completed`, afficher le rang final de l'équipe (nécessite un calcul côté serveur basé sur le tour d'élimination).
- **Challenge bracket** : le modèle de données le prévoit mais aucune logique/UI n'est implémentée.
- **Tests unitaires** : fonctions `bracketSeeding`, `generateBracket`, `advanceBracket` à couvrir avec des tests.
- **Accessibilité** : ajouter des `aria-label` sur les boutons de toggle bracket dans la live page.
- **Responsive** : valider l'affichage bracket sur mobile (actuellement grid qui passe en 1 colonne).
