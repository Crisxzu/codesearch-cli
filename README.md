# CodeSearch CLI

> Client en ligne de commande pour CodeSearch - Recherche sémantique de code, documents et images.

## 📦 Installation

### Via npm (quand publié)

```bash
npm install -g codesearch-cli
```

### Depuis les sources

```bash
# Cloner le repository
git clone https://github.com/your-username/codesearch-cli.git
cd codesearch-cli

# Installer les dépendances
npm install

# Lier globalement
npm link

# Vérifier l'installation
codesearch-cli --version
```

## 🚀 Utilisation rapide

### 1. Authentification

Avant d'utiliser le CLI, vous devez vous authentifier auprès du backend CodeSearch :

```bash
codesearch-cli auth login
```

Cette commande :
- Vous demande votre email
- Envoie un code de vérification par email
- Stocke votre API key localement dans `.env`

### 2. Surveiller un répertoire

Le mode watch surveille automatiquement un répertoire et indexe les fichiers modifiés :

```bash
# Surveiller le répertoire courant
codesearch-cli watch . -p mon-projet

# Surveiller un répertoire spécifique
codesearch-cli watch ~/dev/my-app -p my-app

# Spécifier l'URL du backend (si différente de localhost:8000)
codesearch-cli watch . -p test --backend-url http://api.example.com
```

**Fichiers automatiquement indexés :**
- ✅ Code source (Python, JavaScript, TypeScript, Java, C++, etc.)
- ✅ Documents (PDF, DOCX, Markdown, TXT)
- ✅ Images (PNG, JPG, GIF, WebP)

**Fichiers ignorés :**
- `.git/`, `node_modules/`, `.venv/`, `__pycache__/`
- Fichiers de logs, fichiers compilés (`.pyc`)
- Configuration (`.env`)

### 3. Rechercher du code

Effectuez une recherche sémantique dans vos fichiers indexés :

```bash
# Recherche simple
codesearch-cli search "calculate the sum of two numbers" -p mon-projet

# Limiter le nombre de résultats
codesearch-cli search "user authentication" -p my-app -k 10

# Recherche sans spécifier de projet (tous les projets)
codesearch-cli search "database connection"
```

**Exemple de résultat :**

```
✓ utils/helpers.py:1-3 (score: 0.78)
  def calculate_sum(a, b):
      """Add two numbers together."""
      return a + b

✓ services/calculator.py:15-20 (score: 0.65)
  class Calculator:
      def add(self, x, y):
          return x + y
```

## 📖 Commandes disponibles

### `auth`

Gérer l'authentification avec le backend CodeSearch.

```bash
# Se connecter / créer un compte
codesearch-cli auth login

# Vérifier le statut de connexion
codesearch-cli auth status
```

### `watch`

Surveiller un répertoire et indexer automatiquement les fichiers.

```bash
codesearch-cli watch [path] [options]
```

**Options :**
- `-p, --project <name>` : Nom du projet (défaut: `default-project`)
- `--backend-url <url>` : URL du backend (défaut: `http://localhost:8000`)

### `search`

Rechercher du code de manière sémantique.

```bash
codesearch-cli search <query> [options]
```

**Options :**
- `-p, --project <name>` : Rechercher dans un projet spécifique
- `-k, --top-k <number>` : Nombre de résultats (défaut: `5`)
- `--backend-url <url>` : URL du backend (défaut: `http://localhost:8000`)

## ⚙️ Configuration

### Variables d'environnement

Le CLI utilise un fichier `.env` pour stocker la configuration locale :

```env
# API Key (générée lors de l'authentification)
CODESEARCH_API_KEY=your_api_key_here

# URL du backend (optionnel)
BACKEND_URL=http://localhost:8000
```

### Options globales

Toutes les commandes acceptent ces options globales :

```bash
--api-key <key>        # Spécifier l'API key manuellement
--backend-url <url>    # URL du backend CodeSearch
-h, --help             # Afficher l'aide
-V, --version          # Afficher la version
```

## 🔧 Développement

### Structure du projet

```
codesearch-cli/
├── src/
│   ├── index.js           # Point d'entrée principal
│   └── commands/
│       ├── auth.js        # Commande d'authentification
│       ├── search.js      # Commande de recherche
│       └── watch.js       # Commande de surveillance
├── package.json
└── README.md
```

### Scripts disponibles

```bash
# Lier localement pour tester
npm link

# Publier sur npm
npm publish
```

### Extensions de fichiers supportées

#### Code
`.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.go`, `.rs`, `.rb`, `.php`, `.html`, `.css`, `.scss`, `.sass`, `.json`, `.yaml`, `.yml`, `.xml`, `.md`, `.txt`, `.sh`, `.bash`, `.sql`, `.r`, `.swift`, `.kt`, `.cs`, `.vb`, `.pl`, `.lua`

#### Images
`.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.webp`, `.svg`, `.ico`

#### Documents
`.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.ppt`

## 🐛 Dépannage

### "API key not found"

Vous devez d'abord vous authentifier :

```bash
codesearch-cli auth login
```

### "Connection refused"

Le backend CodeSearch n'est pas accessible. Vérifiez :
1. Que le backend est démarré (`uvicorn backend.main:app --reload`)
2. L'URL du backend avec `--backend-url`

### Les fichiers ne s'indexent pas

Vérifiez que :
1. L'extension du fichier est supportée
2. Le fichier n'est pas dans un répertoire ignoré (`.git`, `node_modules`, etc.)
3. Les logs du watcher pour voir les erreurs

## 📄 Licence

MIT

## 🔗 Liens

- [Backend CodeSearch](https://github.com/your-username/codesearch)
- [Documentation complète](https://github.com/your-username/codesearch#readme)
- [Signaler un bug](https://github.com/your-username/codesearch-cli/issues)

## 👤 Auteur

Chris Kouassi
