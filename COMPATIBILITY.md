# Compatibilité - Blood Hunter Module

## Foundry VTT

### Versions supportées

| Version | Status | Notes |
|---------|--------|-------|
| v14.x | ✅ **Vérifié** | Version supportée pour dnd5e 5.3.2 |
| v13.x | ❌ Non supporté | Ancienne cible du module |
| v12.x | ❌ Non supporté | Version trop ancienne |
| v11.x | ❌ Non supporté | Version trop ancienne |
| v10.x | ❌ Non supporté | Version trop ancienne |

### Version recommandée
**Foundry VTT v14** est la version supportée par le module.

## Système D&D 5e

### Versions supportées

| Version | Status | Notes |
|---------|--------|-------|
| v5.3.2 | ✅ Vérifié | Version cible |
| v5.3.x | ✅ Compatible | Même branche mineure |
| v4.x | ❌ Non supporté | Ancienne cible du module |
| v3.x | ❌ Non supporté | Ancienne cible du module |
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

## Compatibilité API Foundry v14

Le module Blood Hunter utilise les APIs suivantes, toutes compatibles avec Foundry v14 :

### Core APIs utilisées

| API | Version v14 | Status | Notes |
|-----|-------------|--------|-------|
| `Hooks` | Stable | ✅ | Aucun changement requis |
| `game.settings` | Stable | ✅ | API inchangée |
| `ActiveEffect` | Stable | ✅ | Entièrement compatible |
| `Dialog` | Legacy | ✅ | Utilise Dialog classique (v2 disponible mais pas requis) |
| `Roll` | Updated | ✅ | Utilise async evaluate() correctement |
| `ChatMessage` | Stable | ✅ | API inchangée |
| `Item/Actor` | Stable | ✅ | Documents API stable |
| `Macro` | Stable | ✅ | Création de macros compatible |

### Hooks v14

Tous les hooks utilisés sont stables dans v14 :

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

### Changements dans Foundry v14

Le module est compatible avec tous les changements de v14 :

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
- Syntaxe v14 respectée
- Pas de rolls synchrones

#### ✅ Active Effects
- Utilise `changes` array correctement
- `CONST.ACTIVE_EFFECT_MODES` utilisé
- Transfer flag supporté

## Tests de compatibilité

### Checklist v14

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
| v14.x | v5.3.2 | Latest | Compatible v14 | ✅ Cible |
| v14.x | v5.3.2 | - | - | ✅ Fonctionne |
| v14.x | v5.3.2 | Latest | - | ✅ Fonctionne |
| v14.x | v5.3.2 | - | Compatible v14 | ✅ Fonctionne |

## Problèmes connus

### Aucun problème de compatibilité connu

Pas de problème connu avec la cible Foundry v14 + dnd5e 5.3.2.

## Migration depuis des versions antérieures

### Depuis une cible Foundry/dnd5e plus ancienne
- Mettez Foundry à jour vers v14.
- Mettez le système dnd5e à jour vers 5.3.2.
- Reconstruisez ou resynchronisez les features Blood Hunter si elles viennent d'un import ancien.

## Support et rapports de bugs

Si vous rencontrez des problèmes de compatibilité :

1. Vérifiez la version de Foundry VTT (doit être v14)
2. Vérifiez la version du système dnd5e (doit être 5.3.2)
3. Consultez la console (F12) pour les erreurs
4. Désactivez les autres modules pour isoler le problème
5. Ouvrez une issue sur GitHub avec :
   - Version de Foundry VTT
   - Version du système dnd5e
   - Versions des modules installés (DAE, midi-qol)
   - Message d'erreur complet
   - Steps pour reproduire

---

**Note importante** : la compatibilité du module cible désormais Foundry v14 avec la branche dnd5e 5.3.x.

Dernière mise à jour : Mai 2026
