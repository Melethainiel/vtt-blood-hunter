# Build and Development

## Installation

```bash
npm install
```

## Scripts disponibles

### Développement
- `npm run dev` - Build en mode développement avec watch
- `npm run build` - Build en mode production

### Qualité
- `npm run lint` - Vérifie la qualité du code JavaScript
- `npm run lint:fix` - Corrige automatiquement les erreurs de linting
- `npm run validate` - Valide la structure du module

### Packaging
- `npm run package` - Crée le zip du module pour distribution
- `npm run clean` - Nettoie les fichiers de build

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
├── packs/            # Packs de données Foundry
├── dist/             # Fichiers compilés (généré)
└── vtt-blood-hunter.zip  # Package final (généré)
```

## Développement

Pour développer:

1. Clonez le repo
2. Installez les dépendances: `npm install`
3. Lancez le mode dev: `npm run dev`
4. Modifiez les fichiers dans `scripts/` et `styles/`
5. Les changements sont automatiquement recompilés

## Release

Pour créer une nouvelle version:

1. Mettez à jour la version dans `module.json`
2. Créez un tag Git: `git tag v1.0.1`
3. Pushez le tag: `git push origin v1.0.1`
4. Une release GitHub sera automatiquement créée avec le zip du module