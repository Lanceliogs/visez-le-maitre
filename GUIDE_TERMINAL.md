# Guide du terminal — Les bases pour survivre

Ce guide est la pour demystifier le terminal. Pas besoin de tout maitriser : juste comprendre les quelques concepts ci-dessous suffit pour travailler sur le projet.

## 1. C'est quoi, un terminal ?

Un terminal, c'est une fenetre ou on tape des commandes texte au lieu de cliquer sur des icones. Ca fait la meme chose que l'explorateur de fichiers — naviguer dans les dossiers, lancer des programmes — mais en tapant au clavier.

Sur Windows, vous allez croiser deux terminaux principaux :

| Terminal | Comment l'ouvrir | Quand l'utiliser |
|----------|-----------------|------------------|
| **PowerShell** | Tapez "powershell" dans la barre de recherche Windows, ou clic droit dans un dossier → "Ouvrir dans le terminal" | Usage general, commandes npm, lancer l'app |
| **Git Bash** | Installe avec Git. Clic droit dans un dossier → "Git Bash Here" | Commandes Git, ou si PowerShell pose probleme |

Les deux fonctionnent pour ce projet. Utilisez celui avec lequel vous etes le plus a l'aise.

> **Astuce VS Code** : dans VS Code, le terminal integre est accessible avec `` Ctrl+` `` (la touche backtick, en haut a gauche du clavier). Pas besoin d'ouvrir une fenetre separee !

## 2. Le repertoire courant (ou "ou suis-je ?")

Quand vous ouvrez un terminal, vous etes **quelque part** sur votre ordinateur — dans un dossier precis. C'est le **repertoire courant** (en anglais : *current directory* ou *working directory*).

C'est comme ouvrir l'explorateur de fichiers : vous etes toujours dans un dossier. La difference, c'est que le terminal ne vous le montre pas visuellement avec des icones — il faut lire le chemin affiche.

### Savoir ou on est

Dans PowerShell ou Git Bash, le repertoire courant est affiche dans l'invite de commande (le texte avant le curseur) :

```
# PowerShell — le chemin complet est affiche :
PS C:\Users\Marie\Desktop\visez-le-maitre>

# Git Bash — le chemin est affiche en jaune :
Marie@PC MINGW64 ~/Desktop/visez-le-maitre
$
```

Vous pouvez aussi taper :

```
pwd
```

(`pwd` = *print working directory* = "affiche le repertoire courant")

### Pourquoi c'est important ?

Quand vous tapez une commande comme `npm install`, elle s'execute **dans le repertoire courant**. Si vous etes dans `C:\Users\Marie` au lieu de `C:\Users\Marie\Desktop\visez-le-maitre`, la commande va chercher un `package.json` qui n'existe pas — et echouer.

**Regle d'or** : avant de lancer une commande npm, verifiez que vous etes dans le bon dossier.

## 3. Les chemins (paths)

Un **chemin** (ou *path*), c'est l'adresse d'un fichier ou d'un dossier sur votre ordinateur. C'est comme une adresse postale, mais pour les fichiers.

### Chemin absolu vs chemin relatif

| Type | Exemple | Signification |
|------|---------|---------------|
| **Absolu** | `C:\Users\Marie\Desktop\visez-le-maitre` | L'adresse complete depuis la racine du disque. Fonctionne peu importe ou vous etes. |
| **Relatif** | `src\routes` | L'adresse **par rapport au repertoire courant**. Si vous etes dans `visez-le-maitre`, ca pointe vers `visez-le-maitre\src\routes`. |

### Les raccourcis a connaitre

| Symbole | Signification | Exemple |
|---------|--------------|---------|
| `.` | Le dossier actuel | `.\package.json` = le fichier ici |
| `..` | Le dossier parent (un cran au-dessus) | `cd ..` = remonter d'un dossier |
| `~` | Votre dossier utilisateur (Git Bash uniquement) | `cd ~` = aller dans `C:\Users\Marie` |

### Barres obliques : `\` vs `/`

Windows utilise le backslash `\` dans les chemins (`C:\Users\Marie`), tandis que Linux/Mac et Git Bash utilisent le slash `/` (`/c/Users/Marie`).

PowerShell accepte les deux, donc ne vous prenez pas la tete : `cd C:\Users\Marie` et `cd C:/Users/Marie` marchent pareil.

## 4. La commande `cd` — se deplacer dans les dossiers

`cd` signifie *change directory* (changer de repertoire). C'est la commande la plus utilisee.

```
# Aller dans un sous-dossier
cd src

# Aller dans un sous-sous-dossier
cd src\routes

# Remonter d'un dossier
cd ..

# Remonter de deux dossiers
cd ..\..

# Aller directement a un chemin absolu
cd C:\Users\Marie\Desktop\visez-le-maitre
```

### ⚠️ Attention aux chemins avec des espaces !

C'est le piege classique. Si un dossier contient un espace dans son nom, le terminal va croire que c'est deux mots separes.

```
# CA NE MARCHE PAS — le terminal pense que "Projet" est un argument :
cd C:\Users\Marie\Desktop\Mon Projet

# SOLUTION 1 — entourez le chemin avec des guillemets :
cd "C:\Users\Marie\Desktop\Mon Projet"

# SOLUTION 2 (PowerShell) — utilisez un backtick avant l'espace :
cd C:\Users\Marie\Desktop\Mon` Projet
```

**La methode des guillemets est la plus fiable** — elle fonctionne partout (PowerShell, Git Bash, cmd). Prenez le reflexe : en cas de doute, mettez des guillemets.

> **Astuce** : commencez a taper le nom du dossier puis appuyez sur `Tab` — le terminal complete automatiquement le nom et ajoute les guillemets si necessaire. C'est la methode la plus paresseuse et donc la meilleure.

### Navigation rapide : le clic droit

Au lieu de taper `cd` a rallonge, vous pouvez :
- **PowerShell** : dans l'explorateur, allez dans le dossier du projet, clic droit → "Ouvrir dans le terminal"
- **Git Bash** : clic droit dans le dossier → "Git Bash Here"
- **VS Code** : ouvrez le dossier du projet dans VS Code (Fichier → Ouvrir le dossier), le terminal integre sera automatiquement dans le bon dossier

## 5. npm — le minimum vital

`npm` (*Node Package Manager*) est l'outil qui gere les dependances du projet (les bibliotheques externes) et lance les scripts de developpement.

### D'ou lancer npm ?

**Toujours depuis la racine du projet** — le dossier qui contient le fichier `package.json`.

```
# Verifiez d'abord que vous etes au bon endroit :
pwd
# Doit afficher quelque chose comme : C:\Users\Marie\Desktop\visez-le-maitre

# Verifiez que package.json est bien la :
ls package.json        # Git Bash
dir package.json       # PowerShell
```

Si `package.json` n'est pas dans le dossier courant, npm ne saura pas quoi faire et affichera une erreur.

### Les commandes npm du quotidien

| Commande | Ce qu'elle fait | Quand l'utiliser |
|----------|----------------|------------------|
| `npm install` | Telecharge toutes les dependances listees dans `package.json` | Apres avoir clone le projet, ou apres un `git pull` qui a modifie `package.json` |
| `npm run dev` | Lance le serveur de developpement | Pour travailler sur l'app au quotidien |
| `npm run build` | Compile l'app pour la production | Avant de deployer |

### Le dossier `node_modules`

Quand vous faites `npm install`, un dossier `node_modules` apparait. Il contient toutes les bibliotheques telechargees. Il est **enorme** (des milliers de fichiers) et ne doit **jamais** etre envoye sur Git (il est dans le `.gitignore`).

Si quelque chose ne marche plus, vous pouvez le supprimer et reinstaller :

```powershell
# PowerShell
Remove-Item -Recurse -Force node_modules
npm install
```

```bash
# Git Bash
rm -rf node_modules
npm install
```

### Arreter un serveur npm

Quand `npm run dev` tourne, il bloque le terminal (c'est normal). Pour l'arreter :

- Appuyez sur `Ctrl+C`
- Le terminal vous rend la main

Si vous avez besoin du terminal pendant que le serveur tourne, ouvrez un **deuxieme terminal** (ou un deuxieme onglet dans VS Code avec le bouton `+`).

## 6. Git — les bases pour travailler en equipe

Git, c'est l'outil qui permet a plusieurs personnes de travailler sur le meme code sans se marcher dessus. Il garde un historique de toutes les modifications — comme un "Ctrl+Z" geant et partage.

### Cloner le projet (la premiere fois)

**Cloner** = telecharger une copie complete du projet depuis internet (GitHub) sur votre PC.

Ca ne se fait qu'**une seule fois**. Apres, vous avez le projet en local et vous n'aurez plus jamais besoin de cloner.

```
# Placez-vous d'abord la ou vous voulez mettre le projet :
cd C:\Users\Marie\Desktop

# Clonez le depot (l'URL sera fournie par l'equipe) :
git clone https://github.com/exemple/visez-le-maitre.git
```

Ca cree un dossier `visez-le-maitre` avec tout le code dedans. Ensuite :

```
cd visez-le-maitre
npm install
npm run dev
```

Et c'est parti !

> **Note** : l'URL du depot est sur la page GitHub du projet. Bouton vert "Code" → copiez l'URL HTTPS.

### Recuperer les derniers changements (`git pull`)

Quand quelqu'un d'autre a pousse des modifications, il faut les recuperer sur votre PC. C'est comme "mettre a jour" votre copie locale.

```
git pull
```

C'est tout. Git va telecharger les nouveautes et les fusionner avec votre copie.

**Quand faire un `git pull` ?**
- Au debut de chaque session de travail (avant de coder)
- Quand on vous dit "j'ai pousse mes modifs"

**Apres un pull** : si le fichier `package.json` a change (nouvelles dependances), relancez `npm install` pour etre a jour. Dans le doute, faites-le systematiquement :

```
git pull
npm install
```

### Voir ou on en est (`git status`)

A tout moment, vous pouvez taper :

```
git status
```

Ca vous dit :
- Sur quelle **branche** vous etes (on verra les branches plus tard)
- Quels fichiers vous avez **modifies**
- Quels fichiers sont **prets a etre enregistres** (staged)

C'est une commande "lecture seule" — elle ne modifie rien, vous pouvez la taper autant de fois que vous voulez sans risque.

### En cas de conflit

Parfois, `git pull` vous dit qu'il y a un **conflit** : deux personnes ont modifie le meme endroit du meme fichier. Pas de panique — parlez-en a l'equipe, ca se resout facilement a deux. En attendant, ne forcez rien.

### Commandes Git de base — resume

| Commande | Ce qu'elle fait |
|----------|----------------|
| `git clone <url>` | Telecharge le projet (une seule fois) |
| `git pull` | Met a jour votre copie locale |
| `git status` | Voir l'etat de vos fichiers |
| `git add .` | Prepare tous vos changements |
| `git commit -m "message"` | Enregistre vos changements dans l'historique |
| `git push` | Envoie vos changements sur GitHub |

Le cycle quotidien typique : `git pull` → coder → `git add .` → `git commit -m "..."` → `git push`.

## 7. Resume — les commandes de survie

```
pwd                          # Ou suis-je ?
cd nom-du-dossier            # Entrer dans un dossier
cd ..                        # Remonter d'un dossier
cd "chemin avec espaces"     # Chemin avec espaces (guillemets !)
ls                           # Lister les fichiers (Git Bash)
dir                          # Lister les fichiers (PowerShell)
npm install                  # Installer les dependances
npm run dev                  # Lancer le serveur de dev
Ctrl+C                       # Arreter le serveur
git clone <url>              # Telecharger le projet (1ere fois)
git pull                     # Recuperer les nouveautes
git status                   # Voir l'etat de mes fichiers
git add .                    # Preparer mes changements
git commit -m "message"      # Enregistrer mes changements
git push                     # Envoyer sur GitHub
```

C'est tout. Avec ces commandes, vous pouvez travailler sur le projet au quotidien. Le reste viendra naturellement avec la pratique !
