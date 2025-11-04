# Build and Development

## Prérequis

- Node.js 20+ 
- npm 9+

## Installation

```bash
npm install
```

## Scripts disponibles

### Développement
- `npm run dev` - Build en mode développement avec watch
- `npm run build` - Build du code JavaScript en mode production
- `npm run build:packs` - Compile les compendiums depuis packData/
- `npm run build:all` - Build complet (compendiums + code)

### Qualité
- `npm run lint` - Vérifie la qualité du code JavaScript
- `npm run lint:fix` - Corrige automatiquement les erreurs de linting
- `npm run validate` - Valide la structure du module

### Packaging
- `npm run package` - Crée le zip du module pour distribution (inclut build:all)
- `npm run clean` - Nettoie les fichiers de build et packs compilés

## Workflow CI/CD

Le projet utilise GitHub Actions pour automatiser:

1. **Tests sur chaque PR** - Linting et validation
2. **Build sur push** - Compilation et packaging
3. **Release automatique** - Publication des releases GitHub

## Structure des fichiers

```
├── scripts/          # Fichiers JavaScript source
├── styles/           # Fichiers CSS
├── lang/             # Fichiers de traduction
├── packData/         # Source des compendiums (JSON)
│   ├── blood-hunter-features/  # Features source
│   └── blood-hunter-items/     # Items source
├── packs/            # Compendiums compilés (généré, LevelDB)
├── dist/             # Fichiers compilés (généré)
└── vtt-blood-hunter.zip  # Package final (généré)
```

## Développement

Pour développer:

1. Clonez le repo
2. Installez les dépendances: `npm install`
3. Compilez les compendiums: `npm run build:packs`
4. Lancez le mode dev: `npm run dev`
5. Modifiez les fichiers dans `scripts/` et `styles/`
6. Les changements sont automatiquement recompilés

### Travailler avec les compendiums

Les compendiums utilisent le système de build de Foundry VTT CLI:

1. **Fichiers sources** sont dans `packData/` au format JSON lisible
2. **Fichiers compilés** sont générés dans `packs/` au format LevelDB (ignorés par git)
3. Pour modifier un compendium:
   - Éditez les fichiers JSON dans `packData/`
   - Lancez `npm run build:packs` pour recompiler
4. **N'éditez jamais** directement les fichiers dans `packs/`

## Release

Pour créer une nouvelle version:

1. Mettez à jour la version dans `module.json`
2. Créez un tag Git: `git tag v1.0.1`
3. Pushez le tag: `git push origin v1.0.1`
4. Une release GitHub sera automatiquement créée avec le zip du module