# Guide d'installation — Visez Le Maitre

Ce guide vous accompagne pas a pas pour mettre en place l'environnement de developpement sur Windows.

## 1. Installer Node.js

Node.js est le moteur qui fait tourner notre application.

1. Allez sur https://nodejs.org/
2. Telechargez la version **LTS** (le gros bouton vert a gauche)
3. Lancez l'installeur `.msi` telecharge
4. Cliquez "Next" partout (les options par defaut sont tres bien)
5. **Important** : cochez la case "Add to PATH" si elle apparait (normalement cochee par defaut)
6. Cliquez "Install", puis "Finish"

### Verifier que ca marche

Ouvrez un **terminal** (tapez "cmd" dans la barre de recherche Windows, ou utilisez Windows Terminal / PowerShell) :

```
node --version
```

Vous devriez voir quelque chose comme `v22.x.x`. Si vous voyez une erreur "commande introuvable", redemarrez votre PC et reessayez.

Verifiez aussi npm (le gestionnaire de packages, installe automatiquement avec Node) :

```
npm --version
```

## 2. Installer Git

Git permet de travailler a plusieurs sur le meme code.

1. Allez sur https://git-scm.com/download/win
2. Telechargez et lancez l'installeur
3. Cliquez "Next" partout (les options par defaut sont correctes)
4. Verifiez dans un terminal :

```
git --version
```

## 3. Installer un editeur de code

On recommande **Visual Studio Code** (VS Code) :

1. Allez sur https://code.visualstudio.com/
2. Telechargez et installez
3. Extension recommandee : cherchez "Svelte for VS Code" dans les extensions et installez-la

## 4. Recuperer le projet

Dans un terminal, naviguez vers le dossier ou vous voulez mettre le projet (par exemple votre Bureau) :

```
cd %USERPROFILE%\Desktop
```

Puis clonez le projet (l'URL sera fournie par l'admin du depot) :

```
git clone <URL_DU_DEPOT>
cd visez-le-maitre
```

## 5. Installer les dependances

Dans le dossier du projet :

```
npm install
```

Cette commande lit le fichier `package.json` et telecharge toutes les bibliotheques necessaires. Ca peut prendre 1-2 minutes la premiere fois.

## 6. Lancer l'application en mode developpement

```
npm run dev
```

Vous verrez un message du type :

```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
```

Ouvrez cette adresse dans votre navigateur. L'application se recharge automatiquement quand vous modifiez un fichier.

Pour arreter le serveur : appuyez sur `Ctrl+C` dans le terminal.

## 7. Structure du projet (pour s'y retrouver)

```
visez-le-maitre/
  src/
    routes/           ← Les pages de l'app (chaque dossier = une URL)
    lib/
      server/         ← Code serveur (base de donnees, logique)
      components/     ← Composants reutilisables (boutons, cartes, etc.)
  static/             ← Fichiers statiques (images, favicon)
  package.json        ← Liste des dependances
```

## 8. Commandes utiles

| Commande | Ce qu'elle fait |
|----------|-----------------|
| `npm run dev` | Lance l'app en mode developpement |
| `npm run build` | Compile l'app pour la production |
| `npm run preview` | Previsualise la version compilee |
| `git pull` | Recupere les derniers changements du depot |
| `git add .` | Prepare tous vos changements pour un commit |
| `git commit -m "message"` | Enregistre vos changements |
| `git push` | Envoie vos changements sur le depot |

## 9. En cas de probleme

### "npm: command not found" ou "'npm' n'est pas reconnu"
→ Redemarrez votre PC apres l'installation de Node.js.

### "node: command not found"
→ Reinstallez Node.js en verifiant que "Add to PATH" est bien coche.

### Erreurs lors de `npm install`
→ Supprimez le dossier `node_modules` et le fichier `package-lock.json`, puis relancez `npm install` :
```
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Le serveur ne demarre pas
→ Verifiez qu'un autre programme n'utilise pas deja le port 5173. Fermez les autres terminaux qui auraient un `npm run dev` en cours.

### Git demande un mot de passe a chaque fois
→ Configurez le credential helper :
```
git config --global credential.helper manager
```

## 10. Premier pas dans le code

Une fois l'app lancee, essayez de modifier un fichier `.svelte` dans `src/routes/` et sauvegardez — vous verrez le navigateur se mettre a jour instantanement. C'est le "hot reload" !

Les fichiers `.svelte` ressemblent a du HTML avec du JavaScript dedans :

```svelte
<script>
  let name = 'monde';
</script>

<h1>Bonjour {name} !</h1>

<style>
  h1 { color: navy; }
</style>
```

Trois blocs : `<script>` pour la logique, le HTML pour la structure, `<style>` pour l'apparence. C'est tout !
