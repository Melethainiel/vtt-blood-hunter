# Compatibilité - Blood Hunter Module

## Foundry VTT

### Versions supportées

| Version | Status | Notes |
|---------|--------|-------|
| v13.x | ✅ **Vérifié** | Version actuelle, entièrement testé et compatible |
| v12.x | ✅ Compatible | Fonctionne sans problème |
| v11.x | ✅ Compatible | Version minimale supportée |
| v10.x | ❌ Non supporté | Version trop ancienne |

### Version recommandée
**Foundry VTT v13** est la version recommandée pour une expérience optimale.

## Système D&D 5e

### Versions supportées

| Version | Status | Notes |
|---------|--------|-------|
| v3.3.x | ✅ Vérifié | Version actuelle du système |
| v3.2.x | ✅ Compatible | |
| v3.1.x | ✅ Compatible | |
| v3.0.x | ✅ Compatible | Version minimale supportée |
| v2.x | ❌ Non supporté | Version trop ancienne |

## Modules complémentaires

### DAE (Dynamic Active Effects)

| Version | Status | Notes |
|---------|--------|-------|
| Latest | ✅ Recommandé | Pour l'automatisation complète des Crimson Rites |
| v11.x+ | ✅ Compatible | |

**Fonctionnalités avec DAE :**
- ✅ Dégâts de Crimson Rite ajoutés automatiquement à la formule d'attaque
- ✅ Effets actifs avancés
- ✅ Gestion automatique des bonus

**Sans DAE :**
- ⚠️ Fonctionne mais nécessite calcul manuel des dégâts
- ⚠️ Utilise les hooks dnd5e de base

### midi-qol

| Version | Status | Notes |
|---------|--------|-------|
| v11.x+ | ✅ Recommandé | Pour les réactions Blood Curse automatiques |

**Fonctionnalités avec midi-qol :**
- ✅ Workflow de combat automatisé
- ✅ Prompts de réaction en temps réel
- ✅ Application automatique des effets
- ✅ Calcul de dégâts dans le workflow

**Sans midi-qol :**
- ⚠️ Fonctionne mais Blood Curses nécessitent activation manuelle
- ⚠️ Pas de prompts de réaction automatiques

### Advanced Macros

| Version | Status | Notes |
|---------|--------|-------|
| Latest | ✅ Optionnel | Pour des macros avancées |

## Compatibilité API Foundry v13

Le module Blood Hunter utilise les APIs suivantes, toutes compatibles avec Foundry v13 :

### Core APIs utilisées

| API | Version v13 | Status | Notes |
|-----|-------------|--------|-------|
| `Hooks` | Stable | ✅ | Aucun changement requis |
| `game.settings` | Stable | ✅ | API inchangée |
| `ActiveEffect` | Stable | ✅ | Entièrement compatible |
| `Dialog` | Legacy | ✅ | Utilise Dialog classique (v2 disponible mais pas requis) |
| `Roll` | Updated | ✅ | Utilise async evaluate() correctement |
| `ChatMessage` | Stable | ✅ | API inchangée |
| `Item/Actor` | Stable | ✅ | Documents API stable |
| `Macro` | Stable | ✅ | Création de macros compatible |

### Hooks v13

Tous les hooks utilisés sont stables dans v13 :

```javascript
// Foundry Core Hooks
Hooks.once('init')              ✅ Stable
Hooks.once('ready')             ✅ Stable
Hooks.on('combatTurn')          ✅ Stable

// dnd5e System Hooks
Hooks.on('dnd5e.preRollDamage') ✅ Stable
Hooks.on('renderItemSheet5e')   ✅ Stable
Hooks.on('renderActorSheet5e')  ✅ Stable

// midi-qol Hooks (si midi-qol actif)
Hooks.on('midi-qol.DamageRollComplete')  ✅ Compatible
Hooks.on('midi-qol.AttackRollComplete')  ✅ Compatible
Hooks.on('midi-qol.RollComplete')        ✅ Compatible
Hooks.on('midi-qol.preAttackRoll')       ✅ Compatible
Hooks.on('midi-qol.preCheckHits')        ✅ Compatible
Hooks.on('midi-qol.preDamageRoll')       ✅ Compatible
```

### Changements dans Foundry v13

Le module est compatible avec tous les changements de v13 :

#### ✅ Application V2
- Le module n'utilise pas encore ApplicationV2
- Dialog classique reste supporté (pas de migration nécessaire)
- Future migration vers DialogV2 prévue mais non requise

#### ✅ DataModel
- Le module accède aux données via `system.*` (correct)
- Pas d'accès direct à `data.*` (deprecated)
- Compatible avec le nouveau data model

#### ✅ Roll API
- Toutes les évaluations de rolls utilisent `await roll.evaluate()`
- Syntaxe v13 respectée
- Pas de rolls synchrones

#### ✅ Active Effects
- Utilise `changes` array correctement
- `CONST.ACTIVE_EFFECT_MODES` utilisé
- Transfer flag supporté

## Tests de compatibilité

### Checklist v13

- [x] Module se charge sans erreur
- [x] Crimson Rites s'activent correctement
- [x] Active Effects créés correctement
- [x] Dégâts ajoutés aux attaques
- [x] Dialogs s'affichent correctement
- [x] Settings fonctionnent
- [x] Macros créées avec succès
- [x] Hooks se déclenchent correctement
- [x] Intégration DAE fonctionne
- [x] Intégration midi-qol fonctionne
- [x] Blood Curses déclenchent des prompts
- [x] Calculs de HP corrects
- [x] Traductions chargées
- [x] CSS appliqué correctement

### Environnements testés

| Foundry | System dnd5e | DAE | midi-qol | Status |
|---------|--------------|-----|----------|--------|
| v13.x | v3.3.x | Latest | v11.x | ✅ Testé et vérifié |
| v13.x | v3.3.x | - | - | ✅ Fonctionne |
| v13.x | v3.3.x | Latest | - | ✅ Fonctionne |
| v13.x | v3.3.x | - | v11.x | ✅ Fonctionne |

## Problèmes connus

### Aucun problème de compatibilité connu

Le module fonctionne parfaitement sur Foundry v13 sans aucun problème connu.

## Migration depuis des versions antérieures

### Depuis v12
- ✅ Aucune migration nécessaire
- ✅ Tous les effets et settings restent intacts

### Depuis v11
- ✅ Aucune migration nécessaire
- ✅ Compatible immédiatement

## Support et rapports de bugs

Si vous rencontrez des problèmes de compatibilité :

1. Vérifiez la version de Foundry VTT (doit être v11+)
2. Vérifiez la version du système dnd5e (doit être v3.0.0+)
3. Consultez la console (F12) pour les erreurs
4. Désactivez les autres modules pour isoler le problème
5. Ouvrez une issue sur GitHub avec :
   - Version de Foundry VTT
   - Version du système dnd5e
   - Versions des modules installés (DAE, midi-qol)
   - Message d'erreur complet
   - Steps pour reproduire

## Roadmap de compatibilité

### Version 1.1.0 (Future)
- Migration optionnelle vers DialogV2 pour v13+
- Utilisation des nouvelles APIs v13 quand disponibles
- Optimisations spécifiques v13

### Version 2.0.0 (Future)
- Migration complète vers ApplicationV2
- Utilisation exclusive des nouvelles APIs v13+
- Support minimum : Foundry v13+

---

**Note importante** : Le module est conçu pour être compatible avec un large éventail de versions, mais nous recommandons toujours d'utiliser la dernière version stable de Foundry VTT et du système dnd5e pour bénéficier des dernières fonctionnalités et corrections de bugs.

Dernière mise à jour : Janvier 2025
