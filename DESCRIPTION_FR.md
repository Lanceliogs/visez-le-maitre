# Visez Le Maitre — Description de la solution

## Principe

**Visez Le Maitre** est une application web dediee a la gestion de concours de palet vendeen. Le nom fait reference au maitre, le petit palet que l'on vise. Elle permet d'organiser un concours complet — de l'inscription des equipes jusqu'a la finale — depuis un simple navigateur. Fonctionne en local sur un ordinateur ou deployee sur internet (Vercel).

L'organisateur cree un concours, partage un lien d'inscription (QR code ou copier-coller), les equipes s'inscrivent, puis le concours se deroule selon le format officiel : phase de poules, poule finale (principale), consolante, et challenges optionnels.

## Format officiel supporte

1. **Phase de poules** — groupes de 5-6 equipes, 5 parties chacune
2. **Classement** — victoires > points marques > goal-average (difference)
3. **Principale** — les N meilleures equipes (16/32), elimination directe, tirage au sort
4. **Consolante** — 16 equipes suivantes, elimination directe, finale en 15 points (configurable)
5. **Challenges** (optionnels) — perdants du 1er tour de la principale et de la consolante

Toutes les phases d'elimination se jouent en parallele.

## Avantages

- **Aucune installation** — tout fonctionne dans le navigateur, pas d'application a telecharger.
- **Mise en place rapide** — QR code pour inscrire les equipes en quelques secondes.
- **Calculs automatiques** — classement des poules, tirage au sort, generation des arbres d'elimination.
- **Temps reel** — notifications SSE quand le statut d'une equipe change (nouveau match, score confirme, etc.).
- **Minimaliste** — chaque equipe ne voit que son propre statut sur son telephone. Pas de surcharge.
- **Autonome** — les equipes saisissent et confirment elles-memes les scores. L'admin n'intervient qu'en cas de litige.
- **Borne partagee** — pour les equipes sans telephone, un appareil partage avec connexion par code PIN.
- **Flexible** — fonctionne en local (SQLite, un seul PC) ou en ligne (Postgres, acces distant).
- **Classement public** — page consultable par tous (spectateurs, organisateurs) sans authentification.

## Inconvenients

- **Idealement chaque equipe a un telephone** — l'experience est optimale avec un smartphone par equipe. Le mode borne (code PIN) permet de gerer les equipes sans telephone, mais ajoute une legere file d'attente.
- **Dependance au reseau** — les notifications SSE necessitent une connexion stable (le rafraichissement manuel reste possible en cas de coupure).
- **Token a conserver** — si une equipe perd son token (effacement du navigateur), elle doit le coller a nouveau. Il faut donc penser a le copier au moment de l'inscription.
- **Scores bases sur la confiance** — le systeme repose sur l'honnetete des equipes pour la saisie des scores. En cas de mauvaise foi, l'admin peut forcer un score.
- **Pas adapte aux tres grands concours** — l'architecture legere convient a des concours de taille moderee (jusqu'a une centaine d'equipes). Au-dela, des optimisations seraient necessaires.

## Configuration par l'organisateur

A la creation du concours, l'admin choisit :
- Nom du concours
- Taille des equipes (1, 2, ou 3 joueurs)
- Score cible (defaut : 13 points)
- Score de la finale consolante (defaut : 15 points)
- Nombre d'equipes qualifiees pour la principale (16 ou 32)
- Activer les challenges (oui/non)
